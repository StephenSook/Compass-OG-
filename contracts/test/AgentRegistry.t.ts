import { expect } from "chai";
import { ethers } from "hardhat";
import type { Signer } from "ethers";
import type { AgentRegistry } from "../typechain-types";

describe("AgentRegistry — ERC-7857-stripped Compass Agent INFT (soulbound)", function () {
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
  const FIXTURE_URI = "ipfs://0g-storage-mock-root-001";
  const FIXTURE_TRUST_ROOT = ethers.keccak256(
    ethers.toUtf8Bytes("HELP+Bethune+MFMW-merkle-root"),
  );

  it("mints an agent + emits AgentMinted", async function () {
    const { reg, maria, deployer } = await deploy();
    const attestor = await deployer.getAddress();

    await expect(
      reg.connect(maria).mintAgent(FIXTURE_METADATA_HASH, FIXTURE_URI, attestor, FIXTURE_TRUST_ROOT),
    )
      .to.emit(reg, "AgentMinted")
      .withArgs(1n, await maria.getAddress(), FIXTURE_METADATA_HASH, FIXTURE_URI, attestor, FIXTURE_TRUST_ROOT);

    expect(await reg.ownerOf(1)).to.equal(await maria.getAddress());
  });

  it("rejects mintAgent with zero metadataHash", async function () {
    const { reg, maria, deployer } = await deploy();
    await expect(
      reg
        .connect(maria)
        .mintAgent(ethers.ZeroHash, FIXTURE_URI, await deployer.getAddress(), FIXTURE_TRUST_ROOT),
    ).to.be.revertedWithCustomError(reg, "InvalidMetadataHash");
  });

  it("only the agent owner can update metadata + zero-hash rejected", async function () {
    const { reg, maria, deployer, other } = await deploy();
    await reg
      .connect(maria)
      .mintAgent(FIXTURE_METADATA_HASH, FIXTURE_URI, await deployer.getAddress(), FIXTURE_TRUST_ROOT);

    const newHash = ethers.keccak256(ethers.toUtf8Bytes("v2"));
    const newUri = "ipfs://v2";

    await expect(reg.connect(maria).updateMetadata(1, newHash, newUri, "0x"))
      .to.emit(reg, "MetadataUpdated")
      .withArgs(1, newHash, newUri);

    await expect(
      reg.connect(other).updateMetadata(1, newHash, newUri, "0x"),
    ).to.be.revertedWithCustomError(reg, "NotAgentOwner");

    await expect(
      reg.connect(maria).updateMetadata(1, ethers.ZeroHash, newUri, "0x"),
    ).to.be.revertedWithCustomError(reg, "InvalidMetadataHash");
  });

  it("authorizeUsage stores permissions blob (ERC-7857 same-principal delegation)", async function () {
    const { reg, maria, deployer, delegate } = await deploy();
    await reg
      .connect(maria)
      .mintAgent(FIXTURE_METADATA_HASH, FIXTURE_URI, await deployer.getAddress(), FIXTURE_TRUST_ROOT);

    const permissions = ethers.toUtf8Bytes("read:vault,policy:HELP");
    const delegateAddr = await delegate.getAddress();

    await expect(reg.connect(maria).authorizeUsage(1, delegateAddr, permissions))
      .to.emit(reg, "UsageAuthorized")
      .withArgs(1, delegateAddr, ethers.hexlify(permissions));

    expect(await reg.authorizations(1, delegateAddr)).to.equal(ethers.hexlify(permissions));
  });

  it("rejects authorizeUsage from non-owner", async function () {
    const { reg, maria, deployer, other } = await deploy();
    await reg
      .connect(maria)
      .mintAgent(FIXTURE_METADATA_HASH, FIXTURE_URI, await deployer.getAddress(), FIXTURE_TRUST_ROOT);

    await expect(
      reg.connect(other).authorizeUsage(1, await deployer.getAddress(), "0xff"),
    ).to.be.revertedWithCustomError(reg, "NotAgentOwner");
  });

  it("attestEligibility stores receipt + emits + rejects empty quote", async function () {
    const { reg, maria, deployer, oracle } = await deploy();
    await reg
      .connect(maria)
      .mintAgent(FIXTURE_METADATA_HASH, FIXTURE_URI, await deployer.getAddress(), FIXTURE_TRUST_ROOT);
    await reg.connect(deployer).setOracle(await oracle.getAddress(), true);

    const policyId = ethers.keccak256(ethers.toUtf8Bytes("help"));
    const receiptHash = ethers.keccak256(ethers.toUtf8Bytes("r1"));

    await expect(reg.connect(oracle).attestEligibility(1, policyId, receiptHash, "0xfeed"))
      .to.emit(reg, "EligibilityAttested")
      .withArgs(1, policyId, receiptHash, "0xfeed");

    expect(await reg.lastReceipt(1, policyId)).to.equal(receiptHash);

    await expect(
      reg.connect(oracle).attestEligibility(1, policyId, receiptHash, "0x"),
    ).to.be.revertedWithCustomError(reg, "EmptyAttestationQuote");
  });

  it("rejects attestEligibility from non-registered oracle (proper error)", async function () {
    const { reg, maria, deployer, other } = await deploy();
    await reg
      .connect(maria)
      .mintAgent(FIXTURE_METADATA_HASH, FIXTURE_URI, await deployer.getAddress(), FIXTURE_TRUST_ROOT);

    const policyId = ethers.keccak256(ethers.toUtf8Bytes("help"));
    await expect(
      reg.connect(other).attestEligibility(1, policyId, ethers.ZeroHash, "0xff"),
    ).to.be.revertedWithCustomError(reg, "NotAuthorizedOracle");
  });

  it("verifyAttestation v1 stub: rejects empty bytes, accepts non-empty", async function () {
    const { reg } = await deploy();
    expect(await reg.verifyAttestation(1, "0x")).to.equal(false);
    expect(await reg.verifyAttestation(1, "0xfeed")).to.equal(true);
  });

  it("getEncryptedURI returns the agent's vault URI", async function () {
    const { reg, maria, deployer } = await deploy();
    await reg
      .connect(maria)
      .mintAgent(FIXTURE_METADATA_HASH, FIXTURE_URI, await deployer.getAddress(), FIXTURE_TRUST_ROOT);
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

  it("SOULBOUND: transferFrom is rejected (single-principal model)", async function () {
    const { reg, maria, deployer, other } = await deploy();
    await reg
      .connect(maria)
      .mintAgent(FIXTURE_METADATA_HASH, FIXTURE_URI, await deployer.getAddress(), FIXTURE_TRUST_ROOT);

    await expect(
      reg
        .connect(maria)
        .transferFrom(await maria.getAddress(), await other.getAddress(), 1),
    ).to.be.revertedWithCustomError(reg, "SoulboundTransferDenied");

    // safeTransferFrom variants also blocked.
    await expect(
      reg
        .connect(maria)
        ["safeTransferFrom(address,address,uint256)"](
          await maria.getAddress(),
          await other.getAddress(),
          1,
        ),
    ).to.be.revertedWithCustomError(reg, "SoulboundTransferDenied");
  });
});
