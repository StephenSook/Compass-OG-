import { expect } from "chai";
import { ethers } from "hardhat";
import * as fc from "fast-check";
import type { CompassHub, AgentRegistry } from "../typechain-types";
import type { Signer } from "ethers";

/// Property-based invariant tests per Phase 3d.7 of the locked plan.
///
/// Locked invariants:
///  - inv-1: usedNullifiers monotonic — once true, never false again
///  - inv-2: agents[tokenId].metadataHash only updates via updateMetadata
///           from the owner (or via mintAgent at creation)
///  - inv-3: no ReceiptIssued without prior PolicyRegistered
///  - inv-4: usedReceiptIds monotonic — once issued, can never re-issue
///  - inv-5: AgentRegistry soulbound — no transferFrom / safeTransferFrom path
///           ever moves an agent between non-zero addresses

describe("Invariants — property-based fuzz (Phase 3d.7)", function () {
  this.timeout(120_000);

  async function deployStack() {
    const [deployer, maria, provider, oracle] = await ethers.getSigners();
    const RegFactory = await ethers.getContractFactory("AgentRegistry");
    const reg = (await RegFactory.deploy()) as unknown as AgentRegistry;
    await reg.waitForDeployment();
    const HubFactory = await ethers.getContractFactory("CompassHub");
    const hub = (await HubFactory.deploy(await reg.getAddress())) as unknown as CompassHub;
    await hub.waitForDeployment();
    return { reg, hub, deployer, maria, provider, oracle };
  }

  it("inv-1: usedNullifiers is monotonic across 30 random grants", async function () {
    const { reg, hub, deployer, maria, provider } = await deployStack();
    const policyId = ethers.keccak256(ethers.toUtf8Bytes("help"));
    const policyHash = ethers.keccak256(ethers.toUtf8Bytes("help-canonical"));
    await hub.connect(deployer).registerPolicy(policyId, policyHash, "ipfs://help", 100);
    await reg
      .connect(maria)
      .mintAgent(
        ethers.keccak256(ethers.toUtf8Bytes("vault")),
        "ipfs://vault",
        await deployer.getAddress(),
        ethers.ZeroHash || ethers.keccak256(ethers.toUtf8Bytes("trust")),
      );

    const nullifiers = await fc.sample(
      fc.uint8Array({ minLength: 32, maxLength: 32 }),
      30,
    );
    const seen = new Set<string>();
    for (const nbytes of nullifiers) {
      const nullifier = ethers.hexlify(nbytes);
      const before = await hub.usedNullifiers(nullifier);
      // For nullifiers we've never seen, before MUST be false.
      // For nullifiers we have seen, before MUST be true (monotonic).
      if (seen.has(nullifier)) {
        expect(before).to.equal(true);
      } else {
        expect(before).to.equal(false);
      }
      // Sign + consume the grant.
      const grant = {
        agentTokenId: 1n,
        policyId,
        provider: await provider.getAddress(),
        nonce: BigInt(Math.floor(Math.random() * 1_000_000)),
        expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
        nullifier,
      };
      const domain = {
        name: "Compass",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await hub.getAddress(),
      };
      const types = {
        Grant: [
          { name: "agentTokenId", type: "uint256" },
          { name: "policyId", type: "bytes32" },
          { name: "provider", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "expiry", type: "uint64" },
          { name: "nullifier", type: "bytes32" },
        ],
      };
      const sig = await maria.signTypedData(domain, types, grant);
      if (seen.has(nullifier)) {
        await expect(
          hub.connect(provider).consumeGrant(grant, sig),
        ).to.be.revertedWithCustomError(hub, "GrantAlreadyUsed");
      } else {
        await hub.connect(provider).consumeGrant(grant, sig);
        seen.add(nullifier);
      }
      // After: must always be true.
      expect(await hub.usedNullifiers(nullifier)).to.equal(true);
    }
  });

  it("inv-2: agent metadataHash never changes except via updateMetadata from owner", async function () {
    const { reg, deployer, maria } = await deployStack();
    const original = ethers.keccak256(ethers.toUtf8Bytes("original-vault"));
    await reg
      .connect(maria)
      .mintAgent(
        original,
        "ipfs://v1",
        await deployer.getAddress(),
        ethers.keccak256(ethers.toUtf8Bytes("trust")),
      );

    expect((await reg.agents(1)).metadataHash).to.equal(original);

    // Try various un-authorized state mutations. None should change metadataHash.
    const [, , , , , attacker] = await ethers.getSigners();

    // 1. attacker calls updateMetadata — must revert
    await expect(
      reg
        .connect(attacker)
        .updateMetadata(1, ethers.keccak256(ethers.toUtf8Bytes("hacked")), "ipfs://hack", "0x"),
    ).to.be.revertedWithCustomError(reg, "NotAgentOwner");
    expect((await reg.agents(1)).metadataHash).to.equal(original);

    // 2. authorizeUsage doesn't change metadataHash even when called by owner
    await reg.connect(maria).authorizeUsage(1, await attacker.getAddress(), "0xff");
    expect((await reg.agents(1)).metadataHash).to.equal(original);

    // 3. owner can update — only path
    const newHash = ethers.keccak256(ethers.toUtf8Bytes("v2"));
    await reg.connect(maria).updateMetadata(1, newHash, "ipfs://v2", "0x");
    expect((await reg.agents(1)).metadataHash).to.equal(newHash);
  });

  it("inv-3: issueReceipt requires PolicyRegistered + active", async function () {
    const { hub, deployer, oracle } = await deployStack();
    await hub.connect(deployer).setOracle(await oracle.getAddress(), true);

    const randomPolicies = await fc.sample(fc.uint8Array({ minLength: 32, maxLength: 32 }), 10);
    for (const pbytes of randomPolicies) {
      const policyId = ethers.hexlify(pbytes);
      const receiptId = ethers.keccak256(
        ethers.toUtf8Bytes("receipt-" + Math.random()),
      );
      // Unregistered → must revert PolicyNotFound
      await expect(
        hub
          .connect(oracle)
          .issueReceipt(
            receiptId,
            policyId,
            ethers.ZeroHash,
            BigInt(Math.floor(Date.now() / 1000) + 3600),
            ethers.ZeroHash,
          ),
      ).to.be.revertedWithCustomError(hub, "PolicyNotFound");
    }
  });

  it("inv-4: usedReceiptIds is monotonic across 20 random receipts", async function () {
    const { hub, deployer, oracle } = await deployStack();
    const policyId = ethers.keccak256(ethers.toUtf8Bytes("help"));
    await hub
      .connect(deployer)
      .registerPolicy(
        policyId,
        ethers.keccak256(ethers.toUtf8Bytes("hash")),
        "ipfs://help",
        100,
      );
    await hub.connect(deployer).setOracle(await oracle.getAddress(), true);

    const ids = await fc.sample(fc.uint8Array({ minLength: 32, maxLength: 32 }), 20);
    const issued = new Set<string>();
    for (const idbytes of ids) {
      const receiptId = ethers.hexlify(idbytes);
      const expiry = BigInt(Math.floor(Date.now() / 1000) + 3600);
      if (issued.has(receiptId)) {
        await expect(
          hub
            .connect(oracle)
            .issueReceipt(receiptId, policyId, ethers.ZeroHash, expiry, ethers.ZeroHash),
        ).to.be.revertedWithCustomError(hub, "ReceiptAlreadyIssued");
        expect(await hub.usedReceiptIds(receiptId)).to.equal(true);
      } else {
        await hub
          .connect(oracle)
          .issueReceipt(receiptId, policyId, ethers.ZeroHash, expiry, ethers.ZeroHash);
        issued.add(receiptId);
        expect(await hub.usedReceiptIds(receiptId)).to.equal(true);
      }
    }
  });

  it("inv-5: AgentRegistry soulbound — no transfer between non-zero addresses", async function () {
    const { reg, deployer, maria } = await deployStack();
    await reg
      .connect(maria)
      .mintAgent(
        ethers.keccak256(ethers.toUtf8Bytes("vault")),
        "ipfs://vault",
        await deployer.getAddress(),
        ethers.keccak256(ethers.toUtf8Bytes("trust")),
      );

    const others = (await ethers.getSigners()).slice(2);
    for (const other of others.slice(0, 5)) {
      await expect(
        reg
          .connect(maria)
          .transferFrom(await maria.getAddress(), await other.getAddress(), 1),
      ).to.be.revertedWithCustomError(reg, "SoulboundTransferDenied");

      await expect(
        reg
          .connect(maria)
          ["safeTransferFrom(address,address,uint256)"](
            await maria.getAddress(),
            await other.getAddress(),
            1,
          ),
      ).to.be.revertedWithCustomError(reg, "SoulboundTransferDenied");
    }

    // Owner unchanged after all attempts.
    expect(await reg.ownerOf(1)).to.equal(await maria.getAddress());
  });
});
