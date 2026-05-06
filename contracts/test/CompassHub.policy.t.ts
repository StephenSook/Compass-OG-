import { expect } from "chai";
import { ethers } from "hardhat";
import type { Signer } from "ethers";
import type { CompassHub, AgentRegistry } from "../typechain-types";

describe("CompassHub — Policy registry + Receipt log", function () {
  async function deploy(): Promise<{
    hub: CompassHub;
    reg: AgentRegistry;
    deployer: Signer;
    admin: Signer;
    oracle: Signer;
    other: Signer;
  }> {
    const [deployer, admin, oracle, other] = await ethers.getSigners();
    const RegFactory = await ethers.getContractFactory("AgentRegistry");
    const reg = (await RegFactory.deploy()) as unknown as AgentRegistry;
    await reg.waitForDeployment();
    const HubFactory = await ethers.getContractFactory("CompassHub");
    const hub = (await HubFactory.deploy(await reg.getAddress())) as unknown as CompassHub;
    await hub.waitForDeployment();
    return { hub, reg, deployer, admin, oracle, other };
  }

  const HELP_POLICY_ID = ethers.keccak256(ethers.toUtf8Bytes("help-legal-aid"));
  const HELP_POLICY_HASH = ethers.keccak256(ethers.toUtf8Bytes("help-canonical-001"));
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
  });

  it("rejects zero policyHash", async function () {
    const { hub, admin } = await deploy();
    await expect(
      hub.connect(admin).registerPolicy(HELP_POLICY_ID, ethers.ZeroHash, HELP_URI, 100),
    ).to.be.revertedWithCustomError(hub, "InvalidPolicyHash");
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
  });

  it("rejects deactivatePolicy on unknown policy", async function () {
    const { hub, admin } = await deploy();
    await expect(
      hub.connect(admin).deactivatePolicy(ethers.keccak256(ethers.toUtf8Bytes("ghost"))),
    ).to.be.revertedWithCustomError(hub, "PolicyNotFound");
  });

  it("issueReceipt: registered oracle issues + emits with bucketed timestamp", async function () {
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
    const r = await tx.wait();
    const log = r!.logs.find((l: any) => l.fragment?.name === "ReceiptIssued");
    expect(log).to.not.be.undefined;
    const args = (log as any).args;
    expect(args.receiptId).to.equal(receiptId);
    expect(args.policyId).to.equal(HELP_POLICY_ID);
    expect(args.resultHash).to.equal(resultHash);
    expect(args.expiry).to.equal(expiry);
    expect(args.attestationDigest).to.equal(attestationDigest);
    expect(Number(args.timestampBucket) % 900).to.equal(0);

    expect(await hub.usedReceiptIds(receiptId)).to.equal(true);
  });

  it("rejects duplicate receiptId", async function () {
    const { hub, admin, oracle, deployer } = await deploy();
    await hub.connect(admin).registerPolicy(HELP_POLICY_ID, HELP_POLICY_HASH, HELP_URI, 100);
    await hub.connect(deployer).setOracle(await oracle.getAddress(), true);

    const receiptId = ethers.keccak256(ethers.toUtf8Bytes("receipt-dup"));
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 3600);

    await hub
      .connect(oracle)
      .issueReceipt(receiptId, HELP_POLICY_ID, ethers.ZeroHash, expiry, ethers.ZeroHash);
    await expect(
      hub
        .connect(oracle)
        .issueReceipt(receiptId, HELP_POLICY_ID, ethers.ZeroHash, expiry, ethers.ZeroHash),
    ).to.be.revertedWithCustomError(hub, "ReceiptAlreadyIssued");
  });

  it("rejects expired receipt at issuance time", async function () {
    const { hub, admin, oracle, deployer } = await deploy();
    await hub.connect(admin).registerPolicy(HELP_POLICY_ID, HELP_POLICY_HASH, HELP_URI, 100);
    await hub.connect(deployer).setOracle(await oracle.getAddress(), true);

    const receiptId = ethers.keccak256(ethers.toUtf8Bytes("receipt-exp"));
    const expiredAt = BigInt(Math.floor(Date.now() / 1000) - 60);
    await expect(
      hub
        .connect(oracle)
        .issueReceipt(receiptId, HELP_POLICY_ID, ethers.ZeroHash, expiredAt, ethers.ZeroHash),
    ).to.be.revertedWithCustomError(hub, "ReceiptExpired");
  });

  it("rejects issueReceipt from non-registered oracle", async function () {
    const { hub, admin, other } = await deploy();
    await hub.connect(admin).registerPolicy(HELP_POLICY_ID, HELP_POLICY_HASH, HELP_URI, 100);

    const receiptId = ethers.keccak256(ethers.toUtf8Bytes("receipt-bad"));
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 3600);

    await expect(
      hub
        .connect(other)
        .issueReceipt(receiptId, HELP_POLICY_ID, ethers.ZeroHash, expiry, ethers.ZeroHash),
    ).to.be.revertedWithCustomError(hub, "NotAuthorizedOracle");
  });

  it("rejects issueReceipt for inactive policy", async function () {
    const { hub, admin, oracle, deployer } = await deploy();
    await hub.connect(admin).registerPolicy(HELP_POLICY_ID, HELP_POLICY_HASH, HELP_URI, 100);
    await hub.connect(deployer).setOracle(await oracle.getAddress(), true);
    await hub.connect(admin).deactivatePolicy(HELP_POLICY_ID);

    const receiptId = ethers.keccak256(ethers.toUtf8Bytes("receipt-inactive"));
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 3600);
    await expect(
      hub
        .connect(oracle)
        .issueReceipt(receiptId, HELP_POLICY_ID, ethers.ZeroHash, expiry, ethers.ZeroHash),
    ).to.be.revertedWithCustomError(hub, "PolicyInactive");
  });

  it("rejects issueReceipt for unknown policy", async function () {
    const { hub, oracle, deployer } = await deploy();
    await hub.connect(deployer).setOracle(await oracle.getAddress(), true);

    const receiptId = ethers.keccak256(ethers.toUtf8Bytes("receipt-ghost"));
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 3600);
    await expect(
      hub
        .connect(oracle)
        .issueReceipt(
          receiptId,
          ethers.keccak256(ethers.toUtf8Bytes("ghost")),
          ethers.ZeroHash,
          expiry,
          ethers.ZeroHash,
        ),
    ).to.be.revertedWithCustomError(hub, "PolicyNotFound");
  });

  it("setOracle is oracleAdmin-only + emits OracleUpdated", async function () {
    const { hub, oracle, deployer, other } = await deploy();
    await expect(hub.connect(deployer).setOracle(await oracle.getAddress(), true))
      .to.emit(hub, "OracleUpdated")
      .withArgs(await oracle.getAddress(), true);

    await expect(
      hub.connect(other).setOracle(await oracle.getAddress(), true),
    ).to.be.revertedWithCustomError(hub, "NotOracleAdmin");
  });

  it("transferOracleAdmin transfers + emits", async function () {
    const { hub, deployer, other } = await deploy();
    await expect(hub.connect(deployer).transferOracleAdmin(await other.getAddress()))
      .to.emit(hub, "OracleAdminTransferred")
      .withArgs(await deployer.getAddress(), await other.getAddress());

    expect(await hub.oracleAdmin()).to.equal(await other.getAddress());

    // Old admin cannot setOracle anymore.
    await expect(
      hub.connect(deployer).setOracle(await other.getAddress(), true),
    ).to.be.revertedWithCustomError(hub, "NotOracleAdmin");
  });

  it("transferOracleAdmin rejects zero address (slither missing-zero-check)", async function () {
    const { hub, deployer } = await deploy();
    await expect(
      hub.connect(deployer).transferOracleAdmin(ethers.ZeroAddress),
    ).to.be.revertedWithCustomError(hub, "InvalidOracleAdmin");
  });
});
