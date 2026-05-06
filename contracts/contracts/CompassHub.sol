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

    constructor() EIP712("Compass", "1") {}

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
}
