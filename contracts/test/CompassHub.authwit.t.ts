import { expect } from "chai";
import { ethers } from "hardhat";
import type { Signer } from "ethers";
import type { CompassHub, AgentRegistry } from "../typechain-types";

describe("CompassHub — Authwit grant primitive", function () {
  async function deploy(): Promise<{
    hub: CompassHub;
    reg: AgentRegistry;
    deployer: Signer;
    maria: Signer;
    provider: Signer;
    other: Signer;
    chainId: bigint;
    mariaTokenId: bigint;
  }> {
    const [deployer, maria, provider, other] = await ethers.getSigners();
    const RegFactory = await ethers.getContractFactory("AgentRegistry");
    const reg = (await RegFactory.deploy()) as unknown as AgentRegistry;
    await reg.waitForDeployment();

    const HubFactory = await ethers.getContractFactory("CompassHub");
    const hub = (await HubFactory.deploy(await reg.getAddress())) as unknown as CompassHub;
    await hub.waitForDeployment();

    // Mint maria's agent so consumeGrant can recover her as the signer.
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("maria-vault"));
    const trustRoot = ethers.keccak256(ethers.toUtf8Bytes("trust-root"));
    await reg
      .connect(maria)
      .mintAgent(metadataHash, "ipfs://vault", await deployer.getAddress(), trustRoot);

    const network = await ethers.provider.getNetwork();
    return {
      hub,
      reg,
      deployer,
      maria,
      provider,
      other,
      chainId: network.chainId,
      mariaTokenId: 1n,
    };
  }

  type Grant = {
    agentTokenId: bigint;
    policyId: string;
    provider: string;
    nonce: bigint;
    expiry: bigint;
    nullifier: string;
  };

  async function buildGrant(opts: Partial<Grant> & { providerAddress: string; agentTokenId: bigint }): Promise<Grant> {
    const policyId = opts.policyId ?? ethers.keccak256(ethers.toUtf8Bytes("help-legal-aid"));
    const nonce = opts.nonce ?? 1n;
    const expiry = opts.expiry ?? BigInt(Math.floor(Date.now() / 1000) + 3600);
    const nullifier =
      opts.nullifier ??
      ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["uint256", "address", "bytes32"],
          [nonce, opts.providerAddress, policyId],
        ),
      );
    return {
      agentTokenId: opts.agentTokenId,
      policyId,
      provider: opts.providerAddress,
      nonce,
      expiry,
      nullifier,
    };
  }

  async function signGrant(
    signer: Signer,
    hubAddress: string,
    chainId: bigint,
    g: Grant,
  ): Promise<string> {
    const domain = {
      name: "Compass",
      version: "1",
      chainId,
      verifyingContract: hubAddress,
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
    return await signer.signTypedData(domain, types, g);
  }

  async function registerHelpPolicy(hub: CompassHub, admin: Signer): Promise<string> {
    const policyId = ethers.keccak256(ethers.toUtf8Bytes("help-legal-aid"));
    const policyHash = ethers.keccak256(ethers.toUtf8Bytes("help-policy-canonical-json"));
    await hub.connect(admin).registerPolicy(policyId, policyHash, "ipfs://help", 100);
    return policyId;
  }

  it("deploys with Compass EIP-712 domain + AgentRegistry binding", async function () {
    const { hub, reg } = await deploy();
    expect(await hub.agentRegistry()).to.equal(await reg.getAddress());
  });

  it("rejects construction with zero AgentRegistry address", async function () {
    const HubFactory = await ethers.getContractFactory("CompassHub");
    await expect(HubFactory.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(
      HubFactory,
      "InvalidAgentRegistry",
    );
  });

  it("hashGrant produces deterministic typed-data hash", async function () {
    const { hub, provider, mariaTokenId } = await deploy();
    const g = await buildGrant({
      providerAddress: await provider.getAddress(),
      agentTokenId: mariaTokenId,
    });
    expect(await hub.hashGrant(g)).to.equal(await hub.hashGrant(g));
  });

  it("consumes a valid grant signed by the agent owner + emits GrantConsumed", async function () {
    const { hub, deployer, maria, provider, chainId, mariaTokenId } = await deploy();
    await registerHelpPolicy(hub, deployer);
    const providerAddress = await provider.getAddress();
    const g = await buildGrant({ providerAddress, agentTokenId: mariaTokenId });
    const sig = await signGrant(maria, await hub.getAddress(), chainId, g);

    await expect(hub.connect(provider).consumeGrant(g, sig))
      .to.emit(hub, "GrantConsumed")
      .withArgs(g.nullifier, g.policyId, providerAddress, mariaTokenId, anyValue);

    expect(await hub.usedNullifiers(g.nullifier)).to.equal(true);
  });

  it("REJECTS a grant signed by a non-owner of the agent (single-principal binding)", async function () {
    const { hub, deployer, provider, other, chainId, mariaTokenId } = await deploy();
    await registerHelpPolicy(hub, deployer);
    const providerAddress = await provider.getAddress();
    const g = await buildGrant({ providerAddress, agentTokenId: mariaTokenId });
    // `other` signs, but maria owns the agent — this MUST be rejected.
    const sig = await signGrant(other, await hub.getAddress(), chainId, g);

    await expect(
      hub.connect(provider).consumeGrant(g, sig),
    ).to.be.revertedWithCustomError(hub, "UnauthorizedSigner");
  });

  it("REJECTS a grant where provider self-signs as random key (the previously-blessed bug)", async function () {
    const { hub, deployer, provider, chainId, mariaTokenId } = await deploy();
    await registerHelpPolicy(hub, deployer);
    const providerAddress = await provider.getAddress();
    const g = await buildGrant({ providerAddress, agentTokenId: mariaTokenId });
    // Provider signs their own grant — must fail because they don't own the agent.
    const sig = await signGrant(provider, await hub.getAddress(), chainId, g);

    await expect(
      hub.connect(provider).consumeGrant(g, sig),
    ).to.be.revertedWithCustomError(hub, "UnauthorizedSigner");
  });

  it("rejects a replayed grant via nullifier", async function () {
    const { hub, deployer, maria, provider, chainId, mariaTokenId } = await deploy();
    await registerHelpPolicy(hub, deployer);
    const providerAddress = await provider.getAddress();
    const g = await buildGrant({ providerAddress, agentTokenId: mariaTokenId });
    const sig = await signGrant(maria, await hub.getAddress(), chainId, g);

    await hub.connect(provider).consumeGrant(g, sig);
    await expect(
      hub.connect(provider).consumeGrant(g, sig),
    ).to.be.revertedWithCustomError(hub, "GrantAlreadyUsed");
  });

  it("rejects an expired grant", async function () {
    const { hub, deployer, maria, provider, chainId, mariaTokenId } = await deploy();
    await registerHelpPolicy(hub, deployer);
    const providerAddress = await provider.getAddress();
    const g = await buildGrant({
      providerAddress,
      agentTokenId: mariaTokenId,
      expiry: BigInt(Math.floor(Date.now() / 1000) - 60),
    });
    const sig = await signGrant(maria, await hub.getAddress(), chainId, g);

    await expect(
      hub.connect(provider).consumeGrant(g, sig),
    ).to.be.revertedWithCustomError(hub, "GrantExpired");
  });

  it("rejects when caller is not the bound provider", async function () {
    const { hub, deployer, maria, provider, other, chainId, mariaTokenId } = await deploy();
    await registerHelpPolicy(hub, deployer);
    const providerAddress = await provider.getAddress();
    const g = await buildGrant({ providerAddress, agentTokenId: mariaTokenId });
    const sig = await signGrant(maria, await hub.getAddress(), chainId, g);

    await expect(
      hub.connect(other).consumeGrant(g, sig),
    ).to.be.revertedWithCustomError(hub, "WrongProvider");
  });

  it("rejects a malformed signature (wrong length)", async function () {
    const { hub, deployer, provider, mariaTokenId } = await deploy();
    await registerHelpPolicy(hub, deployer);
    const providerAddress = await provider.getAddress();
    const g = await buildGrant({ providerAddress, agentTokenId: mariaTokenId });

    await expect(
      hub.connect(provider).consumeGrant(g, "0xdeadbeef"),
    ).to.be.revertedWithCustomError(hub, "MalformedSignature");
  });

  it("rejects an unsigned (zero-byte) signature", async function () {
    const { hub, deployer, provider, mariaTokenId } = await deploy();
    await registerHelpPolicy(hub, deployer);
    const providerAddress = await provider.getAddress();
    const g = await buildGrant({ providerAddress, agentTokenId: mariaTokenId });

    await expect(
      hub.connect(provider).consumeGrant(g, "0x"),
    ).to.be.revertedWithCustomError(hub, "MalformedSignature");
  });

  it("rejects a grant for an unknown policy", async function () {
    const { hub, maria, provider, chainId, mariaTokenId } = await deploy();
    const providerAddress = await provider.getAddress();
    const g = await buildGrant({ providerAddress, agentTokenId: mariaTokenId });
    const sig = await signGrant(maria, await hub.getAddress(), chainId, g);

    await expect(
      hub.connect(provider).consumeGrant(g, sig),
    ).to.be.revertedWithCustomError(hub, "PolicyNotFound");
  });

  it("rejects a grant for a deactivated policy", async function () {
    const { hub, deployer, maria, provider, chainId, mariaTokenId } = await deploy();
    const policyId = await registerHelpPolicy(hub, deployer);
    await hub.connect(deployer).deactivatePolicy(policyId);

    const providerAddress = await provider.getAddress();
    const g = await buildGrant({ providerAddress, agentTokenId: mariaTokenId });
    const sig = await signGrant(maria, await hub.getAddress(), chainId, g);

    await expect(
      hub.connect(provider).consumeGrant(g, sig),
    ).to.be.revertedWithCustomError(hub, "PolicyInactive");
  });

  it("rejects a grant for a non-existent agent (unauthorized signer path)", async function () {
    const { hub, deployer, maria, provider, chainId } = await deploy();
    await registerHelpPolicy(hub, deployer);
    const providerAddress = await provider.getAddress();
    // tokenId 999 doesn't exist — ownerOf will revert.
    const g = await buildGrant({ providerAddress, agentTokenId: 999n });
    const sig = await signGrant(maria, await hub.getAddress(), chainId, g);

    // ownerOf(nonexistent) reverts with ERC721NonexistentToken — propagates as a generic revert.
    await expect(hub.connect(provider).consumeGrant(g, sig)).to.be.reverted;
  });
});

const anyValue = require("@nomicfoundation/hardhat-chai-matchers/withArgs").anyValue;
