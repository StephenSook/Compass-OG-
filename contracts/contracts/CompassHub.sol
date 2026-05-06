// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @notice Minimal interface to AgentRegistry for the consumeGrant signer-binding check.
interface IAgentRegistry {
    function ownerOf(uint256 tokenId) external view returns (address);
}

/// @title CompassHub
/// @notice On-chain hub for Compass policy registry, Authwit-style single-use grants,
///         and bounded-disclosure receipt logging.
/// @dev    Grants are EIP-712 signed by the agent owner (single-principal model);
///         the contract enforces this by recovering the signer and matching it
///         against `agentRegistry.ownerOf(grant.agentTokenId)`. Receipts are
///         emitted only by registered oracles for active policies, with replay
///         protection via `usedReceiptIds` and expiry validation.
contract CompassHub is EIP712 {
    struct Grant {
        uint256 agentTokenId; // the AgentRegistry tokenId whose owner must sign
        bytes32 policyId;
        address provider;
        uint256 nonce;
        uint64 expiry;
        bytes32 nullifier;
    }

    struct PolicyMeta {
        bytes32 policyHash;
        address admin;
        uint32 minAnonymitySet;
        bool active;
        string uri;
    }

    bytes32 private constant GRANT_TYPEHASH =
        keccak256(
            "Grant(uint256 agentTokenId,bytes32 policyId,address provider,uint256 nonce,uint64 expiry,bytes32 nullifier)"
        );

    IAgentRegistry public immutable agentRegistry;
    address public oracleAdmin;

    mapping(bytes32 => bool) public usedNullifiers;
    mapping(bytes32 => bool) public usedReceiptIds;
    mapping(bytes32 => PolicyMeta) public policies;
    mapping(address => bool) public registeredOracles;

    event GrantConsumed(
        bytes32 indexed nullifier,
        bytes32 indexed policyId,
        address indexed provider,
        uint256 agentTokenId,
        uint256 timestamp
    );
    event PolicyRegistered(
        bytes32 indexed policyId,
        bytes32 policyHash,
        string uri,
        uint32 minAnonymitySet
    );
    event PolicyDeactivated(bytes32 indexed policyId);
    event ReceiptIssued(
        bytes32 indexed receiptId,
        bytes32 indexed policyId,
        bytes32 resultHash,
        uint64 expiry,
        bytes32 attestationDigest,
        uint64 timestampBucket
    );
    event OracleUpdated(address indexed oracle, bool active);
    event OracleAdminTransferred(address indexed previous, address indexed next);

    error GrantAlreadyUsed(bytes32 nullifier);
    error GrantExpired(uint64 expiry, uint256 nowTimestamp);
    error WrongProvider(address bound, address caller);
    error MalformedSignature();
    error UnauthorizedSigner(address recovered, address expected);
    error PolicyAlreadyRegistered(bytes32 policyId);
    error PolicyNotFound(bytes32 policyId);
    error NotPolicyAdmin(bytes32 policyId, address caller);
    error NotAuthorizedOracle(address caller);
    error NotOracleAdmin(address caller);
    error PolicyInactive(bytes32 policyId);
    error InvalidPolicyHash();
    error ReceiptAlreadyIssued(bytes32 receiptId);
    error ReceiptExpired(uint64 expiry, uint256 nowTimestamp);
    error InvalidAgentRegistry();

    constructor(address _agentRegistry) EIP712("Compass", "1") {
        if (_agentRegistry == address(0)) revert InvalidAgentRegistry();
        agentRegistry = IAgentRegistry(_agentRegistry);
        oracleAdmin = msg.sender;
    }

    // -------------------------------------------------------------------------
    // Authwit single-use grant
    // -------------------------------------------------------------------------

    function hashGrant(Grant calldata g) external view returns (bytes32) {
        return _hashGrant(g);
    }

    function _hashGrant(Grant calldata g) internal view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        GRANT_TYPEHASH,
                        g.agentTokenId,
                        g.policyId,
                        g.provider,
                        g.nonce,
                        g.expiry,
                        g.nullifier
                    )
                )
            );
    }

    /// @notice Consume a single-use grant. Caller must be the bound provider; the
    ///         signature must be from `agentRegistry.ownerOf(g.agentTokenId)`; the
    ///         policy must be active. Order: provider → expiry → policy active →
    ///         nullifier → sig shape → recover → bind to agent owner → mark used.
    function consumeGrant(Grant calldata g, bytes calldata sig) external {
        if (msg.sender != g.provider) revert WrongProvider(g.provider, msg.sender);
        if (block.timestamp > g.expiry) revert GrantExpired(g.expiry, block.timestamp);

        PolicyMeta storage p = policies[g.policyId];
        if (p.policyHash == bytes32(0)) revert PolicyNotFound(g.policyId);
        if (!p.active) revert PolicyInactive(g.policyId);

        if (usedNullifiers[g.nullifier]) revert GrantAlreadyUsed(g.nullifier);
        if (sig.length != 65) revert MalformedSignature();

        address recovered = ECDSA.recover(_hashGrant(g), sig);
        address expected = agentRegistry.ownerOf(g.agentTokenId);
        if (recovered != expected) revert UnauthorizedSigner(recovered, expected);

        usedNullifiers[g.nullifier] = true;
        emit GrantConsumed(
            g.nullifier,
            g.policyId,
            g.provider,
            g.agentTokenId,
            block.timestamp
        );
    }

    // -------------------------------------------------------------------------
    // Policy registry
    // -------------------------------------------------------------------------

    function registerPolicy(
        bytes32 policyId,
        bytes32 policyHash,
        string calldata uri,
        uint32 minAnonymitySet
    ) external {
        if (policyHash == bytes32(0)) revert InvalidPolicyHash();
        if (policies[policyId].policyHash != bytes32(0)) {
            revert PolicyAlreadyRegistered(policyId);
        }
        policies[policyId] = PolicyMeta({
            policyHash: policyHash,
            admin: msg.sender,
            minAnonymitySet: minAnonymitySet,
            active: true,
            uri: uri
        });
        emit PolicyRegistered(policyId, policyHash, uri, minAnonymitySet);
    }

    function deactivatePolicy(bytes32 policyId) external {
        PolicyMeta storage p = policies[policyId];
        if (p.policyHash == bytes32(0)) revert PolicyNotFound(policyId);
        if (p.admin != msg.sender) revert NotPolicyAdmin(policyId, msg.sender);
        p.active = false;
        emit PolicyDeactivated(policyId);
    }

    // -------------------------------------------------------------------------
    // Receipt log
    // -------------------------------------------------------------------------

    /// @notice Issue an eligibility receipt. Oracle-only. Receipt id must be unique;
    ///         expiry must be in the future; policy must exist and be active.
    /// @dev    `attestationDigest` is the receipt's load-bearing field. It is
    ///         expected to equal the off-chain digest:
    ///         H(policyHash || providerChallenge || agentIdCommitment ||
    ///         verifierPubKey || result || expiry || credentialBundleHash).
    ///         The off-chain verify-receipt CLI reproduces this hash from public
    ///         inputs + the TEE attestation quote, gated on the canonical
    ///         provider's TEE measurement.
    function issueReceipt(
        bytes32 receiptId,
        bytes32 policyId,
        bytes32 resultHash,
        uint64 expiry,
        bytes32 attestationDigest
    ) external {
        if (!registeredOracles[msg.sender]) revert NotAuthorizedOracle(msg.sender);
        if (usedReceiptIds[receiptId]) revert ReceiptAlreadyIssued(receiptId);
        if (expiry <= block.timestamp) revert ReceiptExpired(expiry, block.timestamp);

        PolicyMeta storage p = policies[policyId];
        if (p.policyHash == bytes32(0)) revert PolicyNotFound(policyId);
        if (!p.active) revert PolicyInactive(policyId);

        usedReceiptIds[receiptId] = true;
        uint64 bucket = uint64((block.timestamp / 900) * 900);
        emit ReceiptIssued(
            receiptId,
            policyId,
            resultHash,
            expiry,
            attestationDigest,
            bucket
        );
    }

    // -------------------------------------------------------------------------
    // Oracle admin
    // -------------------------------------------------------------------------

    function setOracle(address oracle, bool active) external {
        if (msg.sender != oracleAdmin) revert NotOracleAdmin(msg.sender);
        registeredOracles[oracle] = active;
        emit OracleUpdated(oracle, active);
    }

    function transferOracleAdmin(address next) external {
        if (msg.sender != oracleAdmin) revert NotOracleAdmin(msg.sender);
        emit OracleAdminTransferred(oracleAdmin, next);
        oracleAdmin = next;
    }
}
