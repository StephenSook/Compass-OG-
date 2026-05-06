import { expect } from "chai";
import { ethers } from "hardhat";
import type { Signer } from "ethers";
import type { CompassHub, AgentRegistry } from "../typechain-types";

describe("CompassHub — Policy registry + admin", function () {
  async function deploy() {
    const [deployer, admin, other] = await ethers.getSigners();
    const RegFactory = await ethers.getContractFactory("AgentRegistry");
    const reg = (await RegFactory.deploy()) as unknown as AgentRegistry;
    await reg.waitForDeployment();
    const HubFactory = await ethers.getContractFactory("CompassHub");
    const hub = (await HubFactory.deploy(await reg.getAddress())) as unknown as CompassHub;
    await hub.waitForDeployment();
    return { hub, reg, deployer, admin, other };
  }

  const POL_ID = ethers.keccak256(ethers.toUtf8Bytes("help"));
  const POL_HASH = ethers.keccak256(ethers.toUtf8Bytes("policy-canonical"));
  const POL_URI = "ipfs://help";

  it("registers policy + emits PolicyRegistered", async function () {
    const { hub, admin } = await deploy();
    await expect(hub.connect(admin).registerPolicy(POL_ID, POL_HASH, POL_URI, 100))
      .to.emit(hub, "PolicyRegistered")
      .withArgs(POL_ID, POL_HASH, POL_URI, 100);
    const stored = await hub.policies(POL_ID);
    expect(stored.policyHash).to.equal(POL_HASH);
    expect(stored.admin).to.equal(await admin.getAddress());
    expect(stored.minAnonymitySet).to.equal(100);
    expect(stored.active).to.equal(true);
  });

  it("rejects zero policyHash", async function () {
    const { hub, admin } = await deploy();
    await expect(
      hub.connect(admin).registerPolicy(POL_ID, ethers.ZeroHash, POL_URI, 100),
    ).to.be.revertedWithCustomError(hub, "InvalidPolicyHash");
  });

  it("rejects zero minAnonymitySet", async function () {
    const { hub, admin } = await deploy();
    await expect(
      hub.connect(admin).registerPolicy(POL_ID, POL_HASH, POL_URI, 0),
    ).to.be.revertedWithCustomError(hub, "InvalidMinAnonymitySet");
  });

  it("rejects duplicate registration", async function () {
    const { hub, admin } = await deploy();
    await hub.connect(admin).registerPolicy(POL_ID, POL_HASH, POL_URI, 100);
    await expect(
      hub.connect(admin).registerPolicy(POL_ID, POL_HASH, POL_URI, 200),
    ).to.be.revertedWithCustomError(hub, "PolicyAlreadyRegistered");
  });

  it("only the admin can deactivate", async function () {
    const { hub, admin, other } = await deploy();
    await hub.connect(admin).registerPolicy(POL_ID, POL_HASH, POL_URI, 100);
    await expect(
      hub.connect(other).deactivatePolicy(POL_ID),
    ).to.be.revertedWithCustomError(hub, "NotPolicyAdmin");
    await expect(hub.connect(admin).deactivatePolicy(POL_ID))
      .to.emit(hub, "PolicyDeactivated")
      .withArgs(POL_ID);
  });

  it("rejects deactivate on unknown policy", async function () {
    const { hub, admin } = await deploy();
    await expect(
      hub.connect(admin).deactivatePolicy(ethers.keccak256(ethers.toUtf8Bytes("ghost"))),
    ).to.be.revertedWithCustomError(hub, "PolicyNotFound");
  });

  it("transferOracleAdmin transfers + emits + rejects zero", async function () {
    const { hub, deployer, other } = await deploy();
    await expect(hub.connect(deployer).transferOracleAdmin(await other.getAddress()))
      .to.emit(hub, "OracleAdminTransferred")
      .withArgs(await deployer.getAddress(), await other.getAddress());
    expect(await hub.oracleAdmin()).to.equal(await other.getAddress());
    await expect(
      hub.connect(other).transferOracleAdmin(ethers.ZeroAddress),
    ).to.be.revertedWithCustomError(hub, "InvalidOracleAdmin");
  });

  it("transferOracleAdmin rejects non-admin caller", async function () {
    const { hub, other, deployer } = await deploy();
    await expect(
      hub.connect(other).transferOracleAdmin(await deployer.getAddress()),
    ).to.be.revertedWithCustomError(hub, "NotOracleAdmin");
  });
});
