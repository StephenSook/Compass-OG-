// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title AgentRegistry
/// @notice Soulbound ERC-7857-stripped Agent INFT for Compass.
/// @dev    Transfers between non-zero addresses revert. mintAgent is
///         caller-permissionless (anyone mints their own agent).
///         updateMetadata requires the user-supplied teeAttestation to be
///         non-empty AND verifyAttestation to return true — gates vault
///         repointing on at least the v1 stub.
contract AgentRegistry is ERC721 {
    struct Agent {
        bytes32 metadataHash;
        string encryptedURI;
        address attestor;
        bytes32 trustListRoot;
    }

    uint256 private _nextTokenId;
    mapping(uint256 => Agent) public agents;
    mapping(uint256 => mapping(address => bytes)) public authorizations;

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
    event UsageRevoked(uint256 indexed tokenId, address indexed user);

    error NotAgentOwner(uint256 tokenId, address caller);
    error AgentNotFound(uint256 tokenId);
    error InvalidMetadataHash();
    error AttestationRejected();
    error SoulboundTransferDenied(uint256 tokenId, address from, address to);

    constructor() ERC721("Compass Agent", "COMPASS-AGENT") {}

    /// @notice Mint a new Agent INFT to the caller. metadataHash MUST be non-zero
    ///         (the existence-check sentinel relies on it).
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
        emit AgentMinted(
            tokenId,
            msg.sender,
            metadataHash,
            encryptedURI,
            attestor,
            trustListRoot
        );
    }

    /// @notice Update vault pointer. Owner-only; teeAttestation MUST pass
    ///         verifyAttestation. v1 verifyAttestation is a stub requiring
    ///         non-empty bytes; v2 binds to TEE measurement.
    function updateMetadata(
        uint256 tokenId,
        bytes32 newMetadataHash,
        string calldata newURI,
        bytes calldata teeAttestation
    ) external {
        if (ownerOf(tokenId) != msg.sender) revert NotAgentOwner(tokenId, msg.sender);
        if (newMetadataHash == bytes32(0)) revert InvalidMetadataHash();
        if (!_verifyAttestation(tokenId, teeAttestation)) revert AttestationRejected();
        agents[tokenId].metadataHash = newMetadataHash;
        agents[tokenId].encryptedURI = newURI;
        emit MetadataUpdated(tokenId, newMetadataHash, newURI);
    }

    /// @notice ERC-7857 authorizeUsage. Empty `permissions` revokes;
    ///         non-empty stores. Owner-only. v1 does NOT verify the delegate's
    ///         provenance — see honest-limits.md gap #4.
    function authorizeUsage(
        uint256 tokenId,
        address user,
        bytes calldata permissions
    ) external {
        if (ownerOf(tokenId) != msg.sender) revert NotAgentOwner(tokenId, msg.sender);
        authorizations[tokenId][user] = permissions;
        if (permissions.length == 0) {
            emit UsageRevoked(tokenId, user);
        } else {
            emit UsageAuthorized(tokenId, user, permissions);
        }
    }

    function getEncryptedURI(uint256 tokenId) external view returns (string memory) {
        return agents[tokenId].encryptedURI;
    }

    /// @notice v1 STUB — verifies the quote bytes are non-empty AND that the
    ///         tokenId exists. Real TDX RA verification is too expensive
    ///         on-chain; the off-chain enclave service does it. The `view`
    ///         modifier (instead of `pure`) is forward-compatible with v2
    ///         which will read agents[tokenId].trustListRoot.
    function verifyAttestation(
        uint256 tokenId,
        bytes calldata quote
    ) external view returns (bool) {
        return _verifyAttestation(tokenId, quote);
    }

    function _verifyAttestation(
        uint256 tokenId,
        bytes calldata quote
    ) internal view returns (bool) {
        if (quote.length == 0) return false;
        if (agents[tokenId].metadataHash == bytes32(0)) return false;
        return true;
    }

    /// @notice Soulbound — block transfers. Mint (from == 0) and burn
    ///         (to == 0) are still allowed.
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
