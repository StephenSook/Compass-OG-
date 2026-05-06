import { expect } from "chai";
import { ethers } from "hardhat";
import type { Signer } from "ethers";
import type { AgentRegistry } from "../typechain-types";

describe("AgentRegistry — soulbound ERC-7857-stripped INFT", function () {
  async function deploy() {
    const [deployer, maria, delegate, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("AgentRegistry");
    const reg = (await Factory.deploy()) as unknown as AgentRegistry;
    await reg.waitForDeployment();
    return { reg, deployer, maria, delegate, other };
  }

  const META = ethers.keccak256(ethers.toUtf8Bytes("vault"));
  const URI = "ipfs://vault";
  const TRUST = ethers.keccak256(ethers.toUtf8Bytes("trust-root"));

  it("mints + emits AgentMinted", async function () {
    const { reg, maria, deployer } = await deploy();
    await expect(reg.connect(maria).mintAgent(META, URI, await deployer.getAddress(), TRUST))
      .to.emit(reg, "AgentMinted")
      .withArgs(1n, await maria.getAddress(), META, URI, await deployer.getAddress(), TRUST);
    expect(await reg.ownerOf(1)).to.equal(await maria.getAddress());
  });

  it("rejects zero metadataHash on mint", async function () {
    const { reg, maria, deployer } = await deploy();
    await expect(
      reg.connect(maria).mintAgent(ethers.ZeroHash, URI, await deployer.getAddress(), TRUST),
    ).to.be.revertedWithCustomError(reg, "InvalidMetadataHash");
  });

  it("updateMetadata: owner-only + non-empty teeAttestation + non-zero hash", async function () {
    const { reg, maria, deployer, other } = await deploy();
    await reg.connect(maria).mintAgent(META, URI, await deployer.getAddress(), TRUST);
    const newHash = ethers.keccak256(ethers.toUtf8Bytes("v2"));
    const newUri = "ipfs://v2";

    // Non-owner caller rejected
    await expect(
      reg.connect(other).updateMetadata(1, newHash, newUri, "0xfeed"),
    ).to.be.revertedWithCustomError(reg, "NotAgentOwner");

    // Owner with empty teeAttestation rejected
    await expect(
      reg.connect(maria).updateMetadata(1, newHash, newUri, "0x"),
    ).to.be.revertedWithCustomError(reg, "AttestationRejected");

    // Owner with zero metadataHash rejected
    await expect(
      reg.connect(maria).updateMetadata(1, ethers.ZeroHash, newUri, "0xfeed"),
    ).to.be.revertedWithCustomError(reg, "InvalidMetadataHash");

    // Happy path: owner + non-empty attestation + non-zero hash
    await expect(reg.connect(maria).updateMetadata(1, newHash, newUri, "0xfeed"))
      .to.emit(reg, "MetadataUpdated")
      .withArgs(1, newHash, newUri);
  });

  it("authorizeUsage stores permissions + emits UsageAuthorized; empty revokes", async function () {
    const { reg, maria, deployer, delegate } = await deploy();
    await reg.connect(maria).mintAgent(META, URI, await deployer.getAddress(), TRUST);
    const perms = ethers.toUtf8Bytes("read:vault");
    const delegateAddr = await delegate.getAddress();

    await expect(reg.connect(maria).authorizeUsage(1, delegateAddr, perms))
      .to.emit(reg, "UsageAuthorized")
      .withArgs(1, delegateAddr, ethers.hexlify(perms));

    // Empty permissions emits UsageRevoked instead
    await expect(reg.connect(maria).authorizeUsage(1, delegateAddr, "0x"))
      .to.emit(reg, "UsageRevoked")
      .withArgs(1, delegateAddr);
  });

  it("rejects authorizeUsage from non-owner", async function () {
    const { reg, maria, deployer, other } = await deploy();
    await reg.connect(maria).mintAgent(META, URI, await deployer.getAddress(), TRUST);
    await expect(
      reg.connect(other).authorizeUsage(1, await deployer.getAddress(), "0xff"),
    ).to.be.revertedWithCustomError(reg, "NotAgentOwner");
  });

  it("verifyAttestation: rejects empty + rejects unknown tokenId + accepts valid", async function () {
    const { reg, maria, deployer } = await deploy();
    await reg.connect(maria).mintAgent(META, URI, await deployer.getAddress(), TRUST);

    expect(await reg.verifyAttestation(1, "0x")).to.equal(false);
    expect(await reg.verifyAttestation(999, "0xfeed")).to.equal(false);
    expect(await reg.verifyAttestation(1, "0xfeed")).to.equal(true);
  });

  it("getEncryptedURI returns the agent's vault URI", async function () {
    const { reg, maria, deployer } = await deploy();
    await reg.connect(maria).mintAgent(META, URI, await deployer.getAddress(), TRUST);
    expect(await reg.getEncryptedURI(1)).to.equal(URI);
  });

  it("SOULBOUND: transferFrom rejected", async function () {
    const { reg, maria, deployer, other } = await deploy();
    await reg.connect(maria).mintAgent(META, URI, await deployer.getAddress(), TRUST);
    await expect(
      reg.connect(maria).transferFrom(await maria.getAddress(), await other.getAddress(), 1),
    ).to.be.revertedWithCustomError(reg, "SoulboundTransferDenied");
  });

  it("SOULBOUND: safeTransferFrom 3-arg rejected", async function () {
    const { reg, maria, deployer, other } = await deploy();
    await reg.connect(maria).mintAgent(META, URI, await deployer.getAddress(), TRUST);
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

  it("SOULBOUND: safeTransferFrom 4-arg rejected", async function () {
    const { reg, maria, deployer, other } = await deploy();
    await reg.connect(maria).mintAgent(META, URI, await deployer.getAddress(), TRUST);
    await expect(
      reg
        .connect(maria)
        ["safeTransferFrom(address,address,uint256,bytes)"](
          await maria.getAddress(),
          await other.getAddress(),
          1,
          "0x",
        ),
    ).to.be.revertedWithCustomError(reg, "SoulboundTransferDenied");
  });

  it("SOULBOUND: approve + 3rd-party transferFrom still rejected", async function () {
    const { reg, maria, deployer, other } = await deploy();
    await reg.connect(maria).mintAgent(META, URI, await deployer.getAddress(), TRUST);
    await reg.connect(maria).approve(await other.getAddress(), 1);
    await expect(
      reg.connect(other).transferFrom(await maria.getAddress(), await other.getAddress(), 1),
    ).to.be.revertedWithCustomError(reg, "SoulboundTransferDenied");
  });
});
