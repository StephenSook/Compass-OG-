// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IAgentRegistry
/// @notice Public surface CompassHub depends on. Pulled to its own file so
///         AgentRegistry can declare conformance via `is IAgentRegistry`
///         without importing the full CompassHub contract (which would
///         create a circular import). Separating the interface also lets
///         downstream verifiers depend on the interface alone.
interface IAgentRegistry {
    function ownerOf(uint256 tokenId) external view returns (address);

    function verifyAttestation(
        uint256 tokenId,
        bytes calldata quote
    ) external view returns (bool);
}
