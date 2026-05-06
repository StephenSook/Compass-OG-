import { expect } from "chai";
import { ethers } from "hardhat";
import type { Signer } from "ethers";
import type { AgentRegistry } from "../typechain-types";

describe("AgentRegistry — ERC-7857-stripped Compass Agent INFT", function () {
  async function deploy(): Promise<{
    reg: AgentRegistry;
    deployer: Signer;
    maria: Signer;
    delegate: Signer;
    oracle: Signer;
    other: Signer;
  }> {
    const [deployer, maria, delegate, oracle, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("AgentRegistry");
    const reg = (await Factory.deploy()) as unknown as AgentRegistry;
    await reg.waitForDeployment();
    return { reg, deployer, maria, delegate, oracle, other };
  }

  const FIXTURE_METADATA_HASH = ethers.keccak256(
    ethers.toUtf8Bytes("maria-encrypted-vault-v1"),
  );
  const FIXTURE_URI = "ipfs://0g-storage-mock-root-hash-001";
  const FIXTURE_TRUST_ROOT = ethers.keccak256(
    ethers.toUtf8Bytes("HELP+Bethune+MFMW-merkle-root"),
  );

  it("mints an agent with metadata hash + encryptedURI", async function () {
    const { reg, maria, deployer } = await deploy();
    const attestorAddr = await deployer.getAddress();

    await expect(
      reg
        .connect(maria)
        .mintAgent(FIXTURE_METADATA_HASH, FIXTURE_URI, attestorAddr, FIXTURE_TRUST_ROOT),
    )
      .to.emit(reg, "AgentMinted")
      .withArgs(
        1n,
        await maria.getAddress(),
        FIXTURE_METADATA_HASH,
        FIXTURE_URI,
        attestorAddr,
        FIXTURE_TRUST_ROOT,
      );

    const stored = await reg.agents(1);
    expect(stored.metadataHash).to.equal(FIXTURE_METADATA_HASH);
    expect(stored.encryptedURI).to.equal(FIXTURE_URI);
    expect(stored.attestor).to.equal(attestorAddr);
    expect(stored.trustListRoot).to.equal(FIXTURE_TRUST_ROOT);
    expect(await reg.ownerOf(1)).to.equal(await maria.getAddress());
  });

  it("only the agent owner can update metadata", async function () {
    const { reg, maria, deployer, other } = await deploy();
    await reg
      .connect(maria)
      .mintAgent(
        FIXTURE_METADATA_HASH,
        FIXTURE_URI,
        await deployer.getAddress(),
        FIXTURE_TRUST_ROOT,
      );

    const newHash = ethers.keccak256(ethers.toUtf8Bytes("maria-vault-v2"));
    const newUri = "ipfs://0g-storage-mock-root-hash-002";

    await expect(reg.connect(maria).updateMetadata(1, newHash, newUri, "0x"))
      .to.emit(reg, "MetadataUpdated")
      .withArgs(1, newHash, newUri);

    await expect(
      reg.connect(other).updateMetadata(1, newHash, newUri, "0x"),
    ).to.be.revertedWithCustomError(reg, "NotAgentOwner");
  });

  it("authorizeUsage stores the permission blob (ERC-7857)", async function () {
    const { reg, maria, deployer, delegate } = await deploy();
    await reg
      .connect(maria)
      .mintAgent(
        FIXTURE_METADATA_HASH,
        FIXTURE_URI,
        await deployer.getAddress(),
        FIXTURE_TRUST_ROOT,
      );

    const permissions = ethers.toUtf8Bytes("read:vault,policy:HELP-legal-aid");
    const delegateAddr = await delegate.getAddress();

    await expect(reg.connect(maria).authorizeUsage(1, delegateAddr, permissions))
      .to.emit(reg, "UsageAuthorized")
      .withArgs(1, delegateAddr, ethers.hexlify(permissions));

    expect(await reg.authorizations(1, delegateAddr)).to.equal(
      ethers.hexlify(permissions),
    );
  });

  it("rejects authorizeUsage from a non-owner", async function () {
    const { reg, maria, deployer, delegate, other } = await deploy();
    await reg
      .connect(maria)
      .mintAgent(
        FIXTURE_METADATA_HASH,
        FIXTURE_URI,
        await deployer.getAddress(),
        FIXTURE_TRUST_ROOT,
      );

    await expect(
      reg
        .connect(other)
        .authorizeUsage(1, await delegate.getAddress(), "0xdeadbeef"),
    ).to.be.revertedWithCustomError(reg, "NotAgentOwner");
  });

  it("attestEligibility stores receipt + emits event (registered oracle only)", async function () {
    const { reg, maria, deployer, oracle } = await deploy();
    await reg
      .connect(maria)
      .mintAgent(
        FIXTURE_METADATA_HASH,
        FIXTURE_URI,
        await deployer.getAddress(),
        FIXTURE_TRUST_ROOT,
      );

    await reg.connect(deployer).setOracle(await oracle.getAddress(), true);

    const policyId = ethers.keccak256(ethers.toUtf8Bytes("help-legal-aid"));
    const receiptHash = ethers.keccak256(ethers.toUtf8Bytes("receipt-001"));
    const quote = "0xfeed1234";

    await expect(
      reg.connect(oracle).attestEligibility(1, policyId, receiptHash, quote),
    )
      .to.emit(reg, "EligibilityAttested")
      .withArgs(1, policyId, receiptHash, quote);

    expect(await reg.lastReceipt(1, policyId)).to.equal(receiptHash);
  });

  it("rejects attestEligibility from non-registered oracle", async function () {
    const { reg, maria, deployer, other } = await deploy();
    await reg
      .connect(maria)
      .mintAgent(
        FIXTURE_METADATA_HASH,
        FIXTURE_URI,
        await deployer.getAddress(),
        FIXTURE_TRUST_ROOT,
      );

    const policyId = ethers.keccak256(ethers.toUtf8Bytes("help-legal-aid"));
    const receiptHash = ethers.keccak256(ethers.toUtf8Bytes("receipt-001"));

    await expect(
      reg.connect(other).attestEligibility(1, policyId, receiptHash, "0xff"),
    ).to.be.revertedWithCustomError(reg, "NotAgentOwner");
  });

  it("verifyAttestation v1 stub returns true (off-chain verification documented)", async function () {
    const { reg } = await deploy();
    expect(await reg.verifyAttestation(1, "0xdeadbeef")).to.equal(true);
  });

  it("getEncryptedURI returns the agent's vault URI", async function () {
    const { reg, maria, deployer } = await deploy();
    await reg
      .connect(maria)
      .mintAgent(
        FIXTURE_METADATA_HASH,
        FIXTURE_URI,
        await deployer.getAddress(),
        FIXTURE_TRUST_ROOT,
      );

    expect(await reg.getEncryptedURI(1)).to.equal(FIXTURE_URI);
  });

  it("setOracle is owner-only + emits OracleUpdated", async function () {
    const { reg, deployer, oracle, other } = await deploy();

    await expect(reg.connect(deployer).setOracle(await oracle.getAddress(), true))
      .to.emit(reg, "OracleUpdated")
      .withArgs(await oracle.getAddress(), true);

    await expect(
      reg.connect(other).setOracle(await oracle.getAddress(), true),
    ).to.be.revertedWithCustomError(reg, "OwnableUnauthorizedAccount");
  });
});
