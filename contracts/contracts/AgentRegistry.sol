// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title AgentRegistry
/// @notice ERC-7857-stripped Agent INFT for Compass. Soulbound by design — Maria's
///         agent identity is bound to her wallet and cannot be transferred. The
///         single-principal model relies on this: the agent owner is the holder
///         of the credential vault, the EIP-712 signer for Authwit grants, and
///         the principal whose key signs SD-JWT VC presentations.
/// @dev    Transfers (other than mint/burn) revert with `SoulboundTransferDenied`.
///         `verifyAttestation` is a v1 stub — it requires the quote bytes to be
///         non-empty but does not perform real TDX RA verification (too expensive
///         on-chain). Real verification is in the off-chain enclave service and
///         documented in docs/honest-limits.md and the README "What's Real /
///         What's Mocked" table.
contract AgentRegistry is ERC721, Ownable {
    struct Agent {
        bytes32 metadataHash;
        string encryptedURI;
        address attestor;
        bytes32 trustListRoot;
    }

    uint256 private _nextTokenId;

    mapping(uint256 => Agent) public agents;
    mapping(uint256 => mapping(bytes32 => bytes32)) public lastReceipt;
    mapping(uint256 => mapping(address => bytes)) public authorizations;
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
    error NotAuthorizedOracle(address caller);
    error InvalidMetadataHash();
    error EmptyAttestationQuote();
    error SoulboundTransferDenied(uint256 tokenId, address from, address to);

    constructor() ERC721("Compass Agent", "COMPASS-AGENT") Ownable(msg.sender) {}

    /// @notice Mint a new Agent INFT to the caller. metadataHash MUST be non-zero
    ///         so the existence check `agents[tokenId].metadataHash == 0` is reliable.
    function mintAgent(
        bytes32 metadataHash,
        string calldata encryptedURI,
        address attestor,
        bytes32 trustListRoot
    ) external returns (uint256 tokenId) {
        if (metadataHash == bytes32(0)) revert InvalidMetadataHash();
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

    function updateMetadata(
        uint256 tokenId,
        bytes32 newMetadataHash,
        string calldata newURI,
        bytes calldata /* teeAttestation */
    ) external {
        if (ownerOf(tokenId) != msg.sender) revert NotAgentOwner(tokenId, msg.sender);
        if (newMetadataHash == bytes32(0)) revert InvalidMetadataHash();
        agents[tokenId].metadataHash = newMetadataHash;
        agents[tokenId].encryptedURI = newURI;
        emit MetadataUpdated(tokenId, newMetadataHash, newURI);
    }

    /// @notice ERC-7857 authorizeUsage — delegates a specific permission set to a
    ///         user without transferring ownership. Note: this is for SAME-PRINCIPAL
    ///         delegation (e.g., the user's hot wallet authorizing a smart-account
    ///         executor); v1 does NOT enforce that the delegate is owned by the
    ///         same principal. Documented in docs/honest-limits.md.
    function authorizeUsage(
        uint256 tokenId,
        address user,
        bytes calldata permissions
    ) external {
        if (ownerOf(tokenId) != msg.sender) revert NotAgentOwner(tokenId, msg.sender);
        authorizations[tokenId][user] = permissions;
        emit UsageAuthorized(tokenId, user, permissions);
    }

    function attestEligibility(
        uint256 tokenId,
        bytes32 policyId,
        bytes32 receiptHash,
        bytes calldata attestationQuote
    ) external {
        if (!registeredOracles[msg.sender]) revert NotAuthorizedOracle(msg.sender);
        if (agents[tokenId].metadataHash == bytes32(0)) revert AgentNotFound(tokenId);
        if (attestationQuote.length == 0) revert EmptyAttestationQuote();
        lastReceipt[tokenId][policyId] = receiptHash;
        emit EligibilityAttested(tokenId, policyId, receiptHash, attestationQuote);
    }

    function getEncryptedURI(uint256 tokenId) external view returns (string memory) {
        return agents[tokenId].encryptedURI;
    }

    /// @notice v1 STUB — requires non-empty quote bytes. Real TDX RA verification
    ///         is too expensive on-chain; the off-chain enclave service performs
    ///         it. Documented in docs/honest-limits.md and the README "What's
    ///         Real / What's Mocked" table.
    function verifyAttestation(
        uint256 /* tokenId */,
        bytes calldata quote
    ) external pure returns (bool) {
        if (quote.length == 0) return false;
        return true;
    }

    function setOracle(address oracle, bool active) external onlyOwner {
        registeredOracles[oracle] = active;
        emit OracleUpdated(oracle, active);
    }

    /// @notice Soulbound — block all transfers (mint and burn still allowed).
    ///         Single-principal model requires the agent identity to be inseparable
    ///         from the original wallet.
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert SoulboundTransferDenied(tokenId, from, to);
        }
        return super._update(to, tokenId, auth);
    }
}
