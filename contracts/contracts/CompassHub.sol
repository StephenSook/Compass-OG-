// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IAgentRegistry {
    function ownerOf(uint256 tokenId) external view returns (address);
    function verifyAttestation(uint256 tokenId, bytes calldata quote) external view returns (bool);
}

/// @title CompassHub
/// @notice Atomic grant-consumption + receipt-issuance hub. A single transaction
///         binds Maria's signed Authwit grant to a TEE-attested eligibility
///         receipt — eliminating the griefing window where a provider could
///         consume a grant without producing a receipt.
contract CompassHub is EIP712 {
    struct Grant {
        uint256 agentTokenId;
        bytes32 policyId;
        address provider;
        uint256 nonce;
        uint64 expiry;
        bytes32 nullifier;
    }

    struct ReceiptInputs {
        bytes32 receiptId;
        bytes32 resultHash;
        uint64 receiptExpiry;
        bytes32 attestationDigest;
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

    /// @notice ReceiptIssued carries every field a verifier needs to match
    ///         off-chain canonical receipt to on-chain emission. nullifier
    ///         binds it to a consumed grant; agentIdCommitment is the
    ///         non-identifying handle for the agent.
    event ReceiptIssued(
        bytes32 indexed receiptId,
        bytes32 indexed policyId,
        bytes32 indexed nullifier,
        bytes32 agentIdCommitment,
        bytes32 resultHash,
        uint64 expiry,
        bytes32 attestationDigest,
        uint64 timestampBucket
    );
    /// @notice GrantConsumed emits agentIdCommitment (not raw tokenId) so the
    ///         on-chain log cannot be correlated to Maria via
    ///         agentRegistry.ownerOf(tokenId). Same commitment is in
    ///         ReceiptIssued — single privacy primitive across both events.
    event GrantConsumed(
        bytes32 indexed nullifier,
        bytes32 indexed policyId,
        address indexed provider,
        bytes32 agentIdCommitment
    );
    event PolicyRegistered(
        bytes32 indexed policyId,
        bytes32 policyHash,
        string uri,
        uint32 minAnonymitySet
    );
    event PolicyDeactivated(bytes32 indexed policyId);
    event OracleAdminTransferred(address indexed previous, address indexed next);

    error GrantAlreadyUsed(bytes32 nullifier);
    error GrantExpired(uint64 expiry, uint256 nowTimestamp);
    error WrongProvider(address bound, address caller);
    error MalformedSignature();
    error UnauthorizedSigner(address recovered, address expected);
    error PolicyAlreadyRegistered(bytes32 policyId);
    error PolicyNotFound(bytes32 policyId);
    error NotPolicyAdmin(bytes32 policyId, address caller);
    error NotOracleAdmin(address caller);
    error PolicyInactive(bytes32 policyId);
    error InvalidPolicyHash();
    error InvalidMinAnonymitySet();
    error ReceiptAlreadyIssued(bytes32 receiptId);
    error ReceiptExpired(uint64 expiry, uint256 nowTimestamp);
    error InvalidReceiptId();
    error InvalidResultHash();
    error InvalidAttestationDigest();
    error InvalidAgentRegistry();
    error InvalidOracleAdmin();

    constructor(address _agentRegistry) EIP712("Compass", "1") {
        if (_agentRegistry == address(0)) revert InvalidAgentRegistry();
        agentRegistry = IAgentRegistry(_agentRegistry);
        oracleAdmin = msg.sender;
    }

    // -------------------------------------------------------------------------
    // Atomic grant + receipt
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

    /// @notice Atomically consume a single-use grant AND issue the receipt.
    ///         Caller must be the bound provider; the signature must come from
    ///         the agent owner; the policy must be active; receipt fields must
    ///         be non-zero; receipt expiry must be in the future. Both effects
    ///         (nullifier + receiptId) are written in the same tx — no
    ///         half-state, no provider-grief window.
    /// @dev    Order of checks: provider → grant expiry → policy exists+active →
    ///         nullifier unused → sig length → recover signer → bind to agent
    ///         owner → receipt fields non-zero → receipt expiry → receipt id
    ///         unused → effects → events.
    function consumeGrantAndIssueReceipt(
        Grant calldata g,
        bytes calldata sig,
        ReceiptInputs calldata r
    ) external {
        // === Caller binding ===
        if (msg.sender != g.provider) revert WrongProvider(g.provider, msg.sender);

        // === Grant validity ===
        // slither-disable-next-line timestamp
        if (block.timestamp > g.expiry) revert GrantExpired(g.expiry, block.timestamp);

        PolicyMeta storage p = policies[g.policyId];
        if (p.policyHash == bytes32(0)) revert PolicyNotFound(g.policyId);
        if (!p.active) revert PolicyInactive(g.policyId);

        if (usedNullifiers[g.nullifier]) revert GrantAlreadyUsed(g.nullifier);
        if (sig.length != 65) revert MalformedSignature();

        // === Single-principal signer binding ===
        address recovered = ECDSA.recover(_hashGrant(g), sig);
        address expected = agentRegistry.ownerOf(g.agentTokenId);
        if (recovered != expected) revert UnauthorizedSigner(recovered, expected);

        // === Receipt validity ===
        if (r.receiptId == bytes32(0)) revert InvalidReceiptId();
        if (r.resultHash == bytes32(0)) revert InvalidResultHash();
        if (r.attestationDigest == bytes32(0)) revert InvalidAttestationDigest();
        // slither-disable-next-line timestamp
        if (r.receiptExpiry <= block.timestamp)
            revert ReceiptExpired(r.receiptExpiry, block.timestamp);
        if (usedReceiptIds[r.receiptId]) revert ReceiptAlreadyIssued(r.receiptId);

        // === Effects ===
        usedNullifiers[g.nullifier] = true;
        usedReceiptIds[r.receiptId] = true;

        bytes32 agentIdCommitment = keccak256(abi.encode(g.agentTokenId, expected));
        // 15-min bucket alignment per threat-model section 1b — the divide-then-multiply
        // floor is the desired behavior, sub-bucket precision IS what we discard.
        // slither-disable-next-line divide-before-multiply
        uint64 bucket = uint64((block.timestamp / 900) * 900);

        // === Events ===
        emit GrantConsumed(g.nullifier, g.policyId, g.provider, agentIdCommitment);
        emit ReceiptIssued(
            r.receiptId,
            g.policyId,
            g.nullifier,
            agentIdCommitment,
            r.resultHash,
            r.receiptExpiry,
            r.attestationDigest,
            bucket
        );
    }

    // -------------------------------------------------------------------------
    // Policy registry
    // -------------------------------------------------------------------------

    /// @notice Register a policy. Caller becomes admin. policyHash must be
    ///         non-zero; minAnonymitySet must be non-zero (per threat-model
    ///         section 1h, every policy declares its k-anonymity floor).
    function registerPolicy(
        bytes32 policyId,
        bytes32 policyHash,
        string calldata uri,
        uint32 minAnonymitySet
    ) external {
        if (policyHash == bytes32(0)) revert InvalidPolicyHash();
        if (minAnonymitySet == 0) revert InvalidMinAnonymitySet();
        if (policies[policyId].policyHash != bytes32(0))
            revert PolicyAlreadyRegistered(policyId);
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
        PolicyMeta storage pol = policies[policyId];
        if (pol.policyHash == bytes32(0)) revert PolicyNotFound(policyId);
        if (pol.admin != msg.sender) revert NotPolicyAdmin(policyId, msg.sender);
        pol.active = false;
        emit PolicyDeactivated(policyId);
    }

    // -------------------------------------------------------------------------
    // Oracle admin (kept for forward-compat; not consumed by the atomic flow)
    // -------------------------------------------------------------------------

    function transferOracleAdmin(address next) external {
        if (msg.sender != oracleAdmin) revert NotOracleAdmin(msg.sender);
        if (next == address(0)) revert InvalidOracleAdmin();
        emit OracleAdminTransferred(oracleAdmin, next);
        oracleAdmin = next;
    }
}
