// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title CompassHub — the on-chain hub for Compass policy registration, Authwit-style
///        grant consumption, and receipt logging.
/// @notice This is the v1 skeleton. consumeGrant currently reverts NotImplemented.
///         Phase 2 builds it out incrementally per the locked plan (Authwit derisk).
contract CompassHub is EIP712 {
    /// @dev Aztec-Authwit-style single-use grant. EIP-712 signed; nullifier-tracked;
    ///      bound to provider + policy + expiry.
    struct Grant {
        bytes32 policyId;
        address provider;
        uint256 nonce;
        uint64 expiry;
        bytes32 nullifier;
    }

    error NotImplemented();

    constructor() EIP712("Compass", "1") {}

    /// @notice Consumes a single-use grant authorizing the caller (provider) to
    ///         emit an eligibility receipt for the bound policyId.
    /// @dev Phase 2 will implement: hash → recover → nullifier check → expiry check
    ///      → provider check → emit GrantConsumed.
    function consumeGrant(Grant calldata, bytes calldata) external pure {
        revert NotImplemented();
    }
}
