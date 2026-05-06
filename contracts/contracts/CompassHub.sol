// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title CompassHub — Aztec-Authwit-style single-use grant primitive.
/// @notice Phases 2.3 through 2.9 of the locked Compass plan: EIP-712 hash,
///         ECDSA recover, nullifier replay protection, expiry, provider binding,
///         malformed-sig handling, and the GrantConsumed event.
/// @dev Phase 3b will add the policy registry; Phase 3c the receipt log.
contract CompassHub is EIP712 {
    /// @notice Aztec-Authwit-style single-use grant. EIP-712 signed; nullifier-tracked;
    ///         bound to provider + policy + expiry.
    struct Grant {
        bytes32 policyId;
        address provider;
        uint256 nonce;
        uint64 expiry;
        bytes32 nullifier;
    }

    /// @dev typehash for the Grant struct, computed once at deploy and stored as constant.
    bytes32 private constant GRANT_TYPEHASH =
        keccak256(
            "Grant(bytes32 policyId,address provider,uint256 nonce,uint64 expiry,bytes32 nullifier)"
        );

    /// @notice Tracks consumed nullifiers — once true, grant cannot be replayed.
    mapping(bytes32 => bool) public usedNullifiers;

    /// @notice Policy registry (Phase 3b). Each policyId maps to a PolicyMeta
    ///         storing the canonical policy JSON hash + admin + active flag.
    struct PolicyMeta {
        bytes32 policyHash;
        address admin;
        uint32 minAnonymitySet;
        bool active;
        string uri;
    }
    mapping(bytes32 => PolicyMeta) public policies;

    /// @notice Receipt log (Phase 3c). Once a receipt is issued, downstream
    ///         providers can verify by reading on-chain events. The `timestampBucket`
    ///         is bucketed to 15-minute granularity per the threat model
    ///         (Section 1b — Verifier collusion mitigation).
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

    event GrantConsumed(
        bytes32 indexed nullifier,
        bytes32 indexed policyId,
        address indexed provider,
        uint256 timestamp
    );

    error GrantAlreadyUsed(bytes32 nullifier);
    error GrantExpired(uint64 expiry, uint256 nowTimestamp);
    error WrongProvider(address bound, address caller);
    error MalformedSignature();
    error InvalidSigner(address recovered);
    error PolicyAlreadyRegistered(bytes32 policyId);
    error PolicyNotFound(bytes32 policyId);
    error NotPolicyAdmin(bytes32 policyId, address caller);
    error NotAuthorizedOracle(address caller);
    error PolicyInactive(bytes32 policyId);

    /// @notice Registered oracles whose receipts are accepted on-chain.
    mapping(address => bool) public registeredOracles;
    address public oracleAdmin;

    constructor() EIP712("Compass", "1") {
        oracleAdmin = msg.sender;
    }

    /// @notice Computes the EIP-712 typed-data hash for a Grant struct.
    function hashGrant(Grant calldata g) external view returns (bytes32) {
        return _hashGrant(g);
    }

    function _hashGrant(Grant calldata g) internal view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        GRANT_TYPEHASH,
                        g.policyId,
                        g.provider,
                        g.nonce,
                        g.expiry,
                        g.nullifier
                    )
                )
            );
    }

    /// @notice Consumes a single-use Grant. Caller must be the bound provider.
    /// @dev Order of checks: provider → expiry → replay → sig shape → recover.
    ///      Each check is its own custom error so reverts are diagnosable.
    function consumeGrant(Grant calldata g, bytes calldata sig) external {
        if (msg.sender != g.provider) {
            revert WrongProvider(g.provider, msg.sender);
        }
        if (block.timestamp > g.expiry) {
            revert GrantExpired(g.expiry, block.timestamp);
        }
        if (usedNullifiers[g.nullifier]) {
            revert GrantAlreadyUsed(g.nullifier);
        }
        if (sig.length != 65) {
            revert MalformedSignature();
        }
        bytes32 digest = _hashGrant(g);
        address recovered = ECDSA.recover(digest, sig);
        if (recovered == address(0)) {
            revert InvalidSigner(recovered);
        }
        usedNullifiers[g.nullifier] = true;
        emit GrantConsumed(g.nullifier, g.policyId, g.provider, block.timestamp);
    }

    // -------------------------------------------------------------------------
    // Phase 3b — Policy registry
    // -------------------------------------------------------------------------

    /// @notice Registers a new policy. Caller becomes the policy admin.
    /// @param policyId        opaque policy identifier (keccak of canonical name)
    /// @param policyHash      sha256 of canonical policy JSON (off-chain in docs/policies/)
    /// @param uri             ipfs:// or https:// URI to the human-readable policy doc
    /// @param minAnonymitySet declared k-anonymity floor for the policy (Phase 1h threat model)
    function registerPolicy(
        bytes32 policyId,
        bytes32 policyHash,
        string calldata uri,
        uint32 minAnonymitySet
    ) external {
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

    /// @notice Deactivates a policy. Only the policy admin can call.
    function deactivatePolicy(bytes32 policyId) external {
        PolicyMeta storage p = policies[policyId];
        if (p.policyHash == bytes32(0)) {
            revert PolicyNotFound(policyId);
        }
        if (p.admin != msg.sender) {
            revert NotPolicyAdmin(policyId, msg.sender);
        }
        p.active = false;
        emit PolicyDeactivated(policyId);
    }

    // -------------------------------------------------------------------------
    // Phase 3c — Receipt log
    // -------------------------------------------------------------------------

    /// @notice Sets / unsets oracle authorization. Only oracleAdmin can call.
    function setOracle(address oracle, bool active) external {
        if (msg.sender != oracleAdmin) {
            revert NotAuthorizedOracle(msg.sender);
        }
        registeredOracles[oracle] = active;
    }

    /// @notice Issues an eligibility receipt. Only registered oracles can call.
    /// @dev timestampBucket = block.timestamp rounded down to 15-min boundary per
    ///      the threat model section 1b (verifier collusion mitigation —
    ///      bucket-aligned timestamps reduce cross-receipt linkability).
    function issueReceipt(
        bytes32 receiptId,
        bytes32 policyId,
        bytes32 resultHash,
        uint64 expiry,
        bytes32 attestationDigest
    ) external {
        if (!registeredOracles[msg.sender]) {
            revert NotAuthorizedOracle(msg.sender);
        }
        PolicyMeta storage p = policies[policyId];
        if (p.policyHash == bytes32(0)) {
            revert PolicyNotFound(policyId);
        }
        if (!p.active) {
            revert PolicyInactive(policyId);
        }
        // Bucket to 15-minute granularity (900 seconds).
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
}
