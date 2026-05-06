// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title AgentRegistry — ERC-7857-stripped Agent identity for Compass.
/// @notice Stripped per the locked plan: mint, getEncryptedURI, authorizeUsage,
///         attestEligibility, verifyAttestation. Each Agent is owned by the
///         user's Privy-derived wallet (single-principal model — see plan
///         Phase 4b keybinding lock).
/// @dev verifyAttestation is a v1 STUB — see docs/honest-limits.md. Real RA-quote
///      verification is too expensive on-chain; the off-chain enclave service
///      verifies the TDX quote against the canonical provider's measurement.
contract AgentRegistry is ERC721, Ownable {
    /// @notice ERC-7857-stripped Agent metadata.
    struct Agent {
        bytes32 metadataHash;   // hash of encrypted credential vault on 0G Storage
        string encryptedURI;    // 0G Storage root-hash URI
        address attestor;       // who issued the genesis credential (mocked v1)
        bytes32 trustListRoot;  // merkle root of accepted issuers
    }

    uint256 private _nextTokenId;

    mapping(uint256 => Agent) public agents;
    /// @notice agentId => policyId => last receiptHash anchored on-chain.
    mapping(uint256 => mapping(bytes32 => bytes32)) public lastReceipt;
    /// @notice ERC-7857-style authorizeUsage delegation table.
    mapping(uint256 => mapping(address => bytes)) public authorizations;
    /// @notice Registered oracles whose signatures count for verifyAttestation (v1 stub).
    mapping(address => bool) public registeredOracles;

    event AgentMinted(
        uint256 indexed tokenId,
        address indexed owner,
        bytes32 metadataHash,
        string encryptedURI,
        address attestor,
        bytes32 trustListRoot
    );
    event MetadataUpdated(uint256 indexed tokenId, bytes32 newMetadataHash, string newURI);
    event UsageAuthorized(uint256 indexed tokenId, address indexed user, bytes permissions);
    event EligibilityAttested(
        uint256 indexed tokenId,
        bytes32 indexed policyId,
        bytes32 receiptHash,
        bytes attestationQuote
    );
    event OracleUpdated(address indexed oracle, bool active);

    error NotAgentOwner(uint256 tokenId, address caller);
    error AgentNotFound(uint256 tokenId);

    constructor() ERC721("Compass Agent", "COMPASS-AGENT") Ownable(msg.sender) {
        // contract owner can register oracles for verifyAttestation v1 stub
    }

    /// @notice Mints a new Agent INFT to the caller.
    function mintAgent(
        bytes32 metadataHash,
        string calldata encryptedURI,
        address attestor,
        bytes32 trustListRoot
    ) external returns (uint256 tokenId) {
        tokenId = ++_nextTokenId;
        agents[tokenId] = Agent({
            metadataHash: metadataHash,
            encryptedURI: encryptedURI,
            attestor: attestor,
            trustListRoot: trustListRoot
        });
        _safeMint(msg.sender, tokenId);
        emit AgentMinted(tokenId, msg.sender, metadataHash, encryptedURI, attestor, trustListRoot);
    }

    /// @notice Updates the encrypted vault pointer. Only the agent owner can call.
    /// @dev teeAttestation arg reserved for v2 — for now, ownership check alone gates.
    function updateMetadata(
        uint256 tokenId,
        bytes32 newMetadataHash,
        string calldata newURI,
        bytes calldata /* teeAttestation */
    ) external {
        if (ownerOf(tokenId) != msg.sender) {
            revert NotAgentOwner(tokenId, msg.sender);
        }
        agents[tokenId].metadataHash = newMetadataHash;
        agents[tokenId].encryptedURI = newURI;
        emit MetadataUpdated(tokenId, newMetadataHash, newURI);
    }

    /// @notice ERC-7857 authorizeUsage — delegates a specific permission set to a user
    ///         without transferring ownership.
    function authorizeUsage(
        uint256 tokenId,
        address user,
        bytes calldata permissions
    ) external {
        if (ownerOf(tokenId) != msg.sender) {
            revert NotAgentOwner(tokenId, msg.sender);
        }
        authorizations[tokenId][user] = permissions;
        emit UsageAuthorized(tokenId, user, permissions);
    }

    /// @notice Anchors a receipt hash for a (tokenId, policyId) pair.
    /// @dev Called by an authorized oracle after Sealed Inference produces the receipt.
    ///      v1 stub: any registered oracle can anchor. v2: gate by attestation
    ///      quote verification on-chain (too expensive — handled off-chain instead).
    function attestEligibility(
        uint256 tokenId,
        bytes32 policyId,
        bytes32 receiptHash,
        bytes calldata attestationQuote
    ) external {
        if (!registeredOracles[msg.sender]) {
            revert NotAgentOwner(tokenId, msg.sender); // reuse error — caller not authorized
        }
        if (agents[tokenId].metadataHash == bytes32(0)) {
            revert AgentNotFound(tokenId);
        }
        lastReceipt[tokenId][policyId] = receiptHash;
        emit EligibilityAttested(tokenId, policyId, receiptHash, attestationQuote);
    }

    function getEncryptedURI(uint256 tokenId) external view returns (string memory) {
        return agents[tokenId].encryptedURI;
    }

    /// @notice v1 STUB — returns true if the bytes are a registered-oracle signature.
    /// @dev Real TDX RA quote verification happens off-chain in the enclave service.
    ///      Documented in docs/honest-limits.md and README "What's Real / What's Mocked".
    function verifyAttestation(
        uint256 /* tokenId */,
        bytes calldata /* quote */
    ) external pure returns (bool) {
        // v1 stub — accepts any non-empty bytes. Real verification: enclave service.
        return true;
    }

    /// @notice Owner-only oracle registration (v1).
    function setOracle(address oracle, bool active) external onlyOwner {
        registeredOracles[oracle] = active;
        emit OracleUpdated(oracle, active);
    }
}
