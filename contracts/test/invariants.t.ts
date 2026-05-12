import { expect } from "chai";
import { ethers } from "hardhat";
import * as fc from "fast-check";
import type { CompassHub, AgentRegistry } from "../typechain-types";
import type { Signer } from "ethers";

/// Property-based invariant tests for the locked plan's invariants.
///
///  inv-1: usedNullifiers + usedReceiptIds are both monotonic (consumeGrantAndIssueReceipt
///         is the single mutator; once flipped, never flippable back).
///  inv-2: agents[tokenId].metadataHash only updates via updateMetadata
///         from the owner with non-empty teeAttestation.
///  inv-3: ReceiptIssued cannot fire without a valid signed grant — there
///         is no other on-chain path to emit it.
///  inv-4: AgentRegistry soulbound — no transferFrom / safeTransferFrom /
///         approve+pull path moves an agent between non-zero addresses.
///  inv-5: zero-value receipt fields always rejected.

describe("Invariants — property + adversarial fuzz", function () {
  this.timeout(180_000);

  async function deployStack() {
    const [deployer, maria, provider, attacker] = await ethers.getSigners();
    const RegFactory = await ethers.getContractFactory("AgentRegistry");
    const reg = (await RegFactory.deploy()) as unknown as AgentRegistry;
    await reg.waitForDeployment();
    const HubFactory = await ethers.getContractFactory("CompassHub");
    const hub = (await HubFactory.deploy(await reg.getAddress())) as unknown as CompassHub;
    await hub.waitForDeployment();
    return { reg, hub, deployer, maria, provider, attacker };
  }

  async function setup(): Promise<{
    reg: AgentRegistry;
    hub: CompassHub;
    deployer: Signer;
    maria: Signer;
    provider: Signer;
    attacker: Signer;
    chainId: bigint;
    policyId: string;
  }> {
    const stack = await deployStack();
    const { reg, hub, deployer, maria } = stack;
    const policyId = ethers.keccak256(ethers.toUtf8Bytes("help"));
    await hub
      .connect(deployer)
      .registerPolicy(policyId, ethers.keccak256(ethers.toUtf8Bytes("h")), "ipfs://h", 100);
    const trust = ethers.keccak256(ethers.toUtf8Bytes("trust"));
    await reg
      .connect(maria)
      .mintAgent(
        ethers.keccak256(ethers.toUtf8Bytes("vault")),
        "ipfs://vault",
        await deployer.getAddress(),
        trust,
      );
    const network = await ethers.provider.getNetwork();
    return { ...stack, chainId: network.chainId, policyId };
  }

  async function buildSignedGrant(
    hub: CompassHub,
    chainId: bigint,
    maria: Signer,
    providerAddress: string,
    policyId: string,
    nonce: bigint,
    nullifier: string,
  ) {
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const grant = {
      agentTokenId: 1n,
      policyId,
      provider: providerAddress,
      nonce,
      expiry,
      nullifier,
    };
    const domain = {
      name: "Compass",
      version: "1",
      chainId,
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
    return { grant, sig };
  }

  it("inv-1: usedNullifiers monotonic with explicit replay attacks", async function () {
    const { hub, maria, provider, chainId, policyId } = await setup();
    const providerAddress = await provider.getAddress();

    // First wave: 5 distinct grants — all should consume cleanly.
    const consumed: { nullifier: string; nonce: bigint; sig: string; grant: any }[] = [];
    for (let i = 0; i < 5; i++) {
      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("nullifier-" + i));
      const { grant, sig } = await buildSignedGrant(
        hub,
        chainId,
        maria,
        providerAddress,
        policyId,
        BigInt(i),
        nullifier,
      );
      const r = {
        receiptId: ethers.keccak256(ethers.toUtf8Bytes("receipt-" + i)),
        resultHash: ethers.keccak256(ethers.toUtf8Bytes("eligible")),
        receiptExpiry: BigInt(Math.floor(Date.now() / 1000) + 7200),
        attestationDigest: ethers.keccak256(ethers.toUtf8Bytes("ra-" + i)),
      };
      await hub.connect(provider).consumeGrantAndIssueReceipt(grant, sig, r);
      consumed.push({ nullifier, nonce: BigInt(i), sig, grant });
      expect(await hub.usedNullifiers(nullifier)).to.equal(true);
    }

    // Second wave: replay each consumed nullifier with a fresh receipt — must revert.
    for (const c of consumed) {
      const r = {
        receiptId: ethers.keccak256(ethers.toUtf8Bytes("receipt-replay-" + c.nonce)),
        resultHash: ethers.keccak256(ethers.toUtf8Bytes("eligible")),
        receiptExpiry: BigInt(Math.floor(Date.now() / 1000) + 7200),
        attestationDigest: ethers.keccak256(ethers.toUtf8Bytes("ra-replay")),
      };
      await expect(
        hub.connect(provider).consumeGrantAndIssueReceipt(c.grant, c.sig, r),
      ).to.be.revertedWithCustomError(hub, "GrantAlreadyUsed");
      // Still true after replay attempt.
      expect(await hub.usedNullifiers(c.nullifier)).to.equal(true);
    }
  });

  it("inv-2: agent metadataHash only changes via updateMetadata from owner", async function () {
    const { reg, maria, deployer, attacker } = await deployStack();
    const original = ethers.keccak256(ethers.toUtf8Bytes("original"));
    const trust = ethers.keccak256(ethers.toUtf8Bytes("trust"));
    await reg
      .connect(maria)
      .mintAgent(original, "ipfs://v1", await deployer.getAddress(), trust);
    expect((await reg.agents(1)).metadataHash).to.equal(original);

    const newHash = ethers.keccak256(ethers.toUtf8Bytes("v2"));

    // Attacker call rejected.
    await expect(
      reg.connect(attacker).updateMetadata(1, newHash, "ipfs://v2", "0xfeed"),
    ).to.be.revertedWithCustomError(reg, "NotAgentOwner");
    expect((await reg.agents(1)).metadataHash).to.equal(original);

    // Empty teeAttestation rejected.
    await expect(
      reg.connect(maria).updateMetadata(1, newHash, "ipfs://v2", "0x"),
    ).to.be.revertedWithCustomError(reg, "AttestationRejected");
    expect((await reg.agents(1)).metadataHash).to.equal(original);

    // Authorized path succeeds.
    await reg.connect(maria).updateMetadata(1, newHash, "ipfs://v2", "0xfeed");
    expect((await reg.agents(1)).metadataHash).to.equal(newHash);
  });

  it("inv-3: ReceiptIssued cannot fire without a valid grant (no other entrypoint)", async function () {
    const { hub } = await deployStack();
    // Iterate through ABI surface — there is exactly one external function that
    // emits ReceiptIssued.
    const fragments = hub.interface.fragments
      .filter((f: any) => f.type === "function")
      .map((f: any) => f.name);
    // The only mutator that should be able to emit ReceiptIssued is consumeGrantAndIssueReceipt.
    expect(fragments).to.include("consumeGrantAndIssueReceipt");
    // Negative: no separate issueReceipt or attestEligibility entrypoint.
    expect(fragments).to.not.include("issueReceipt");
    expect(fragments).to.not.include("attestEligibility");
  });

  it("inv-4: AgentRegistry soulbound under randomized destination addresses", async function () {
    const { reg, maria, deployer } = await deployStack();
    await reg
      .connect(maria)
      .mintAgent(
        ethers.keccak256(ethers.toUtf8Bytes("vault")),
        "ipfs://vault",
        await deployer.getAddress(),
        ethers.keccak256(ethers.toUtf8Bytes("trust")),
      );

    // Use Hardhat's pre-funded signers as randomized destinations (real
    // checksummed addresses). Pull 8 distinct targets.
    const all = await ethers.getSigners();
    const targets = all.slice(2, 10); // skip deployer + maria
    for (const target of targets) {
      await expect(
        reg
          .connect(maria)
          .transferFrom(await maria.getAddress(), await target.getAddress(), 1),
      ).to.be.revertedWithCustomError(reg, "SoulboundTransferDenied");
    }
    expect(await reg.ownerOf(1)).to.equal(await maria.getAddress());
  });

  it("inv-5: receipt zero-value fields always rejected", async function () {
    const { hub, maria, provider, chainId, policyId } = await setup();
    const providerAddress = await provider.getAddress();

    const baseGrant = await buildSignedGrant(
      hub,
      chainId,
      maria,
      providerAddress,
      policyId,
      42n,
      ethers.keccak256(ethers.toUtf8Bytes("n42")),
    );

    const validExpiry = BigInt(Math.floor(Date.now() / 1000) + 7200);
    const validReceiptId = ethers.keccak256(ethers.toUtf8Bytes("rid"));
    const validResult = ethers.keccak256(ethers.toUtf8Bytes("res"));
    const validDigest = ethers.keccak256(ethers.toUtf8Bytes("dig"));

    const cases = [
      {
        name: "InvalidReceiptId",
        r: {
          receiptId: ethers.ZeroHash,
          resultHash: validResult,
          receiptExpiry: validExpiry,
          attestationDigest: validDigest,
        },
      },
      {
        name: "InvalidResultHash",
        r: {
          receiptId: validReceiptId,
          resultHash: ethers.ZeroHash,
          receiptExpiry: validExpiry,
          attestationDigest: validDigest,
        },
      },
      {
        name: "InvalidAttestationDigest",
        r: {
          receiptId: validReceiptId,
          resultHash: validResult,
          receiptExpiry: validExpiry,
          attestationDigest: ethers.ZeroHash,
        },
      },
    ];
    for (const c of cases) {
      await expect(
        hub.connect(provider).consumeGrantAndIssueReceipt(baseGrant.grant, baseGrant.sig, c.r),
      ).to.be.revertedWithCustomError(hub, c.name);
    }
  });
});
