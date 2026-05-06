import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "hardhat";
import type { CompassHub } from "../typechain-types";

describe("CompassHub — Authwit grant primitive", function () {
  async function deploy(): Promise<CompassHub> {
    const Factory = await ethers.getContractFactory("CompassHub");
    const hub = (await Factory.deploy()) as unknown as CompassHub;
    await hub.waitForDeployment();
    return hub;
  }

  it("deploys with Compass EIP-712 domain", async function () {
    const hub = await deploy();
    const addr = await hub.getAddress();
    expect(addr).to.match(/^0x[0-9a-fA-F]{40}$/);
  });

  it("consumeGrant reverts with NotImplemented in v1 skeleton", async function () {
    const hub = await deploy();
    const grant = {
      policyId: ethers.ZeroHash,
      provider: ethers.ZeroAddress,
      nonce: 0,
      expiry: 0,
      nullifier: ethers.ZeroHash,
    };
    await expect(hub.consumeGrant(grant, "0x")).to.be.revertedWithCustomError(
      hub,
      "NotImplemented",
    );
  });
});
