import { expect } from "chai";
import { ethers } from "hardhat";
import type { Signer } from "ethers";
import type { CompassHub } from "../typechain-types";

describe("CompassHub — Policy registry + Receipt log (Phase 3b/3c)", function () {
  async function deploy(): Promise<{
    hub: CompassHub;
    deployer: Signer;
    admin: Signer;
    oracle: Signer;
    other: Signer;
  }> {
    const [deployer, admin, oracle, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CompassHub");
    const hub = (await Factory.deploy()) as unknown as CompassHub;
    await hub.waitForDeployment();
    return { hub, deployer, admin, oracle, other };
  }

  const HELP_POLICY_ID = ethers.keccak256(ethers.toUtf8Bytes("help-legal-aid"));
  const HELP_POLICY_HASH = ethers.keccak256(ethers.toUtf8Bytes("policy-canonical-json-001"));
  const HELP_URI = "ipfs://help-legal-aid-policy.json";

  it("registers a policy + emits PolicyRegistered", async function () {
    const { hub, admin } = await deploy();

    await expect(
      hub.connect(admin).registerPolicy(HELP_POLICY_ID, HELP_POLICY_HASH, HELP_URI, 100),
    )
      .to.emit(hub, "PolicyRegistered")
      .withArgs(HELP_POLICY_ID, HELP_POLICY_HASH, HELP_URI, 100);

    const stored = await hub.policies(HELP_POLICY_ID);
    expect(stored.policyHash).to.equal(HELP_POLICY_HASH);
    expect(stored.admin).to.equal(await admin.getAddress());
    expect(stored.minAnonymitySet).to.equal(100);
    expect(stored.active).to.equal(true);
    expect(stored.uri).to.equal(HELP_URI);
  });

  it("rejects duplicate policy registration", async function () {
    const { hub, admin } = await deploy();
    await hub.connect(admin).registerPolicy(HELP_POLICY_ID, HELP_POLICY_HASH, HELP_URI, 100);
    await expect(
      hub.connect(admin).registerPolicy(HELP_POLICY_ID, HELP_POLICY_HASH, HELP_URI, 200),
    ).to.be.revertedWithCustomError(hub, "PolicyAlreadyRegistered");
  });

  it("only the policy admin can deactivate", async function () {
    const { hub, admin, other } = await deploy();
    await hub.connect(admin).registerPolicy(HELP_POLICY_ID, HELP_POLICY_HASH, HELP_URI, 100);

    await expect(
      hub.connect(other).deactivatePolicy(HELP_POLICY_ID),
    ).to.be.revertedWithCustomError(hub, "NotPolicyAdmin");

    await expect(hub.connect(admin).deactivatePolicy(HELP_POLICY_ID))
      .to.emit(hub, "PolicyDeactivated")
      .withArgs(HELP_POLICY_ID);

    const stored = await hub.policies(HELP_POLICY_ID);
    expect(stored.active).to.equal(false);
  });

  it("rejects deactivatePolicy on unknown policy", async function () {
    const { hub, admin } = await deploy();
    const unknown = ethers.keccak256(ethers.toUtf8Bytes("ghost-policy"));
    await expect(
      hub.connect(admin).deactivatePolicy(unknown),
    ).to.be.revertedWithCustomError(hub, "PolicyNotFound");
  });

  it("issueReceipt: registered oracle issues + emits ReceiptIssued with bucketed timestamp", async function () {
    const { hub, admin, oracle, deployer } = await deploy();
    await hub.connect(admin).registerPolicy(HELP_POLICY_ID, HELP_POLICY_HASH, HELP_URI, 100);
    await hub.connect(deployer).setOracle(await oracle.getAddress(), true);

    const receiptId = ethers.keccak256(ethers.toUtf8Bytes("receipt-001"));
    const resultHash = ethers.keccak256(ethers.toUtf8Bytes("eligible-true"));
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const attestationDigest = ethers.keccak256(ethers.toUtf8Bytes("ra-quote-hash"));

    const tx = await hub
      .connect(oracle)
      .issueReceipt(receiptId, HELP_POLICY_ID, resultHash, expiry, attestationDigest);
    const receipt = await tx.wait();
    expect(receipt).to.not.be.null;

    // Verify the event was emitted with correct args (bucket is computed on-chain).
    const log = receipt!.logs.find(
      (l: any) => l.fragment?.name === "ReceiptIssued",
    );
    expect(log).to.not.be.undefined;
    const args = (log as any).args;
    expect(args.receiptId).to.equal(receiptId);
    expect(args.policyId).to.equal(HELP_POLICY_ID);
    expect(args.resultHash).to.equal(resultHash);
    expect(args.expiry).to.equal(expiry);
    expect(args.attestationDigest).to.equal(attestationDigest);
    // Bucket should be a multiple of 900.
    expect(Number(args.timestampBucket) % 900).to.equal(0);
  });

  it("rejects issueReceipt from non-registered oracle", async function () {
    const { hub, admin, other } = await deploy();
    await hub.connect(admin).registerPolicy(HELP_POLICY_ID, HELP_POLICY_HASH, HELP_URI, 100);

    const receiptId = ethers.keccak256(ethers.toUtf8Bytes("receipt-002"));
    const resultHash = ethers.keccak256(ethers.toUtf8Bytes("eligible-true"));
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const attestationDigest = ethers.keccak256(ethers.toUtf8Bytes("ra-quote"));

    await expect(
      hub
        .connect(other)
        .issueReceipt(receiptId, HELP_POLICY_ID, resultHash, expiry, attestationDigest),
    ).to.be.revertedWithCustomError(hub, "NotAuthorizedOracle");
  });

  it("rejects issueReceipt for inactive policy", async function () {
    const { hub, admin, oracle, deployer } = await deploy();
    await hub.connect(admin).registerPolicy(HELP_POLICY_ID, HELP_POLICY_HASH, HELP_URI, 100);
    await hub.connect(deployer).setOracle(await oracle.getAddress(), true);
    await hub.connect(admin).deactivatePolicy(HELP_POLICY_ID);

    const receiptId = ethers.keccak256(ethers.toUtf8Bytes("receipt-003"));
    const resultHash = ethers.keccak256(ethers.toUtf8Bytes("eligible-true"));
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const attestationDigest = ethers.keccak256(ethers.toUtf8Bytes("ra-quote"));

    await expect(
      hub
        .connect(oracle)
        .issueReceipt(receiptId, HELP_POLICY_ID, resultHash, expiry, attestationDigest),
    ).to.be.revertedWithCustomError(hub, "PolicyInactive");
  });

  it("rejects issueReceipt for unknown policy", async function () {
    const { hub, oracle, deployer } = await deploy();
    await hub.connect(deployer).setOracle(await oracle.getAddress(), true);

    const receiptId = ethers.keccak256(ethers.toUtf8Bytes("receipt-004"));
    const unknownPolicy = ethers.keccak256(ethers.toUtf8Bytes("ghost-policy"));
    const resultHash = ethers.keccak256(ethers.toUtf8Bytes("eligible-true"));
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const attestationDigest = ethers.keccak256(ethers.toUtf8Bytes("ra-quote"));

    await expect(
      hub
        .connect(oracle)
        .issueReceipt(receiptId, unknownPolicy, resultHash, expiry, attestationDigest),
    ).to.be.revertedWithCustomError(hub, "PolicyNotFound");
  });

  it("setOracle is oracleAdmin-only", async function () {
    const { hub, oracle, other } = await deploy();
    await expect(
      hub.connect(other).setOracle(await oracle.getAddress(), true),
    ).to.be.revertedWithCustomError(hub, "NotAuthorizedOracle");
  });
});
