import { expect } from "chai";
import { ethers } from "hardhat";
import type { Signer } from "ethers";
import type { CompassHub, AgentRegistry } from "../typechain-types";

describe("CompassHub — atomic consumeGrantAndIssueReceipt", function () {
  async function deploy() {
    const [deployer, maria, provider, other] = await ethers.getSigners();
    const RegFactory = await ethers.getContractFactory("AgentRegistry");
    const reg = (await RegFactory.deploy()) as unknown as AgentRegistry;
    await reg.waitForDeployment();

    const HubFactory = await ethers.getContractFactory("CompassHub");
    const hub = (await HubFactory.deploy(await reg.getAddress())) as unknown as CompassHub;
    await hub.waitForDeployment();

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

  type Receipt = {
    receiptId: string;
    resultHash: string;
    receiptExpiry: bigint;
    attestationDigest: string;
  };

  function buildGrant(opts: Partial<Grant> & { providerAddress: string; agentTokenId: bigint }): Grant {
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

  function buildReceipt(opts: Partial<Receipt> = {}): Receipt {
    return {
      receiptId: opts.receiptId ?? ethers.keccak256(ethers.toUtf8Bytes("receipt-" + Math.random())),
      resultHash: opts.resultHash ?? ethers.keccak256(ethers.toUtf8Bytes("eligible-true")),
      receiptExpiry: opts.receiptExpiry ?? BigInt(Math.floor(Date.now() / 1000) + 7200),
      attestationDigest:
        opts.attestationDigest ?? ethers.keccak256(ethers.toUtf8Bytes("ra-quote-hash")),
    };
  }

  async function signGrant(
    signer: Signer,
    hubAddress: string,
    chainId: bigint,
    g: Grant,
  ): Promise<string> {
    const domain = { name: "Compass", version: "1", chainId, verifyingContract: hubAddress };
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
    const policyHash = ethers.keccak256(ethers.toUtf8Bytes("help-canonical-json"));
    await hub.connect(admin).registerPolicy(policyId, policyHash, "ipfs://help", 100);
    return policyId;
  }

  it("deploys with EIP-712 domain + AgentRegistry binding", async function () {
    const { hub, reg } = await deploy();
    expect(await hub.agentRegistry()).to.equal(await reg.getAddress());
  });

  it("rejects construction with zero AgentRegistry", async function () {
    const HubFactory = await ethers.getContractFactory("CompassHub");
    await expect(HubFactory.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(
      HubFactory,
      "InvalidAgentRegistry",
    );
  });

  it("happy path: agent owner signs, provider consumes + issues receipt atomically", async function () {
    const { hub, deployer, maria, provider, chainId, mariaTokenId } = await deploy();
    await registerHelpPolicy(hub, deployer);
    const g = buildGrant({ providerAddress: await provider.getAddress(), agentTokenId: mariaTokenId });
    const r = buildReceipt();
    const sig = await signGrant(maria, await hub.getAddress(), chainId, g);

    const tx = await hub.connect(provider).consumeGrantAndIssueReceipt(g, sig, r);
    const receipt = await tx.wait();

    const grantConsumedLog = receipt!.logs.find(
      (l: any) => l.fragment?.name === "GrantConsumed",
    );
    expect(grantConsumedLog).to.not.be.undefined;
    const receiptIssuedLog = receipt!.logs.find(
      (l: any) => l.fragment?.name === "ReceiptIssued",
    );
    expect(receiptIssuedLog).to.not.be.undefined;
    const args = (receiptIssuedLog as any).args;
    expect(args.receiptId).to.equal(r.receiptId);
    expect(args.policyId).to.equal(g.policyId);
    expect(args.nullifier).to.equal(g.nullifier);
    expect(args.resultHash).to.equal(r.resultHash);
    expect(args.attestationDigest).to.equal(r.attestationDigest);
    expect(Number(args.timestampBucket) % 900).to.equal(0);

    expect(await hub.usedNullifiers(g.nullifier)).to.equal(true);
    expect(await hub.usedReceiptIds(r.receiptId)).to.equal(true);
  });

  it("REJECTS grant signed by non-owner of agent", async function () {
    const { hub, deployer, provider, other, chainId, mariaTokenId } = await deploy();
    await registerHelpPolicy(hub, deployer);
    const g = buildGrant({ providerAddress: await provider.getAddress(), agentTokenId: mariaTokenId });
    const r = buildReceipt();
    const sig = await signGrant(other, await hub.getAddress(), chainId, g);
    await expect(
      hub.connect(provider).consumeGrantAndIssueReceipt(g, sig, r),
    ).to.be.revertedWithCustomError(hub, "UnauthorizedSigner");
  });

  it("REJECTS provider self-signing as random key", async function () {
    const { hub, deployer, provider, chainId, mariaTokenId } = await deploy();
    await registerHelpPolicy(hub, deployer);
    const g = buildGrant({ providerAddress: await provider.getAddress(), agentTokenId: mariaTokenId });
    const r = buildReceipt();
    const sig = await signGrant(provider, await hub.getAddress(), chainId, g);
    await expect(
      hub.connect(provider).consumeGrantAndIssueReceipt(g, sig, r),
    ).to.be.revertedWithCustomError(hub, "UnauthorizedSigner");
  });

  it("rejects replayed grant via nullifier", async function () {
    const { hub, deployer, maria, provider, chainId, mariaTokenId } = await deploy();
    await registerHelpPolicy(hub, deployer);
    const g = buildGrant({ providerAddress: await provider.getAddress(), agentTokenId: mariaTokenId });
    const r1 = buildReceipt();
    const r2 = buildReceipt();
    const sig = await signGrant(maria, await hub.getAddress(), chainId, g);

    await hub.connect(provider).consumeGrantAndIssueReceipt(g, sig, r1);
    await expect(
      hub.connect(provider).consumeGrantAndIssueReceipt(g, sig, r2),
    ).to.be.revertedWithCustomError(hub, "GrantAlreadyUsed");
  });

  it("rejects expired grant", async function () {
    const { hub, deployer, maria, provider, chainId, mariaTokenId } = await deploy();
    await registerHelpPolicy(hub, deployer);
    const g = buildGrant({
      providerAddress: await provider.getAddress(),
      agentTokenId: mariaTokenId,
      expiry: BigInt(Math.floor(Date.now() / 1000) - 60),
    });
    const r = buildReceipt();
    const sig = await signGrant(maria, await hub.getAddress(), chainId, g);
    await expect(
      hub.connect(provider).consumeGrantAndIssueReceipt(g, sig, r),
    ).to.be.revertedWithCustomError(hub, "GrantExpired");
  });

  it("rejects when caller is not bound provider", async function () {
    const { hub, deployer, maria, provider, other, chainId, mariaTokenId } = await deploy();
    await registerHelpPolicy(hub, deployer);
    const g = buildGrant({ providerAddress: await provider.getAddress(), agentTokenId: mariaTokenId });
    const r = buildReceipt();
    const sig = await signGrant(maria, await hub.getAddress(), chainId, g);
    await expect(
      hub.connect(other).consumeGrantAndIssueReceipt(g, sig, r),
    ).to.be.revertedWithCustomError(hub, "WrongProvider");
  });

  it("rejects malformed signature (wrong length)", async function () {
    const { hub, deployer, provider, mariaTokenId } = await deploy();
    await registerHelpPolicy(hub, deployer);
    const g = buildGrant({ providerAddress: await provider.getAddress(), agentTokenId: mariaTokenId });
    const r = buildReceipt();
    await expect(
      hub.connect(provider).consumeGrantAndIssueReceipt(g, "0xdeadbeef", r),
    ).to.be.revertedWithCustomError(hub, "MalformedSignature");
  });

  it("rejects unsigned (zero-byte) signature", async function () {
    const { hub, deployer, provider, mariaTokenId } = await deploy();
    await registerHelpPolicy(hub, deployer);
    const g = buildGrant({ providerAddress: await provider.getAddress(), agentTokenId: mariaTokenId });
    const r = buildReceipt();
    await expect(
      hub.connect(provider).consumeGrantAndIssueReceipt(g, "0x", r),
    ).to.be.revertedWithCustomError(hub, "MalformedSignature");
  });

  it("rejects grant for unknown policy", async function () {
    const { hub, maria, provider, chainId, mariaTokenId } = await deploy();
    const g = buildGrant({ providerAddress: await provider.getAddress(), agentTokenId: mariaTokenId });
    const r = buildReceipt();
    const sig = await signGrant(maria, await hub.getAddress(), chainId, g);
    await expect(
      hub.connect(provider).consumeGrantAndIssueReceipt(g, sig, r),
    ).to.be.revertedWithCustomError(hub, "PolicyNotFound");
  });

  it("rejects grant for deactivated policy", async function () {
    const { hub, deployer, maria, provider, chainId, mariaTokenId } = await deploy();
    const policyId = await registerHelpPolicy(hub, deployer);
    await hub.connect(deployer).deactivatePolicy(policyId);
    const g = buildGrant({ providerAddress: await provider.getAddress(), agentTokenId: mariaTokenId });
    const r = buildReceipt();
    const sig = await signGrant(maria, await hub.getAddress(), chainId, g);
    await expect(
      hub.connect(provider).consumeGrantAndIssueReceipt(g, sig, r),
    ).to.be.revertedWithCustomError(hub, "PolicyInactive");
  });

  it("rejects zero-value receipt fields", async function () {
    const { hub, deployer, maria, provider, chainId, mariaTokenId } = await deploy();
    await registerHelpPolicy(hub, deployer);
    const g = buildGrant({ providerAddress: await provider.getAddress(), agentTokenId: mariaTokenId });
    const sig = await signGrant(maria, await hub.getAddress(), chainId, g);

    await expect(
      hub
        .connect(provider)
        .consumeGrantAndIssueReceipt(g, sig, buildReceipt({ receiptId: ethers.ZeroHash })),
    ).to.be.revertedWithCustomError(hub, "InvalidReceiptId");
    await expect(
      hub
        .connect(provider)
        .consumeGrantAndIssueReceipt(g, sig, buildReceipt({ resultHash: ethers.ZeroHash })),
    ).to.be.revertedWithCustomError(hub, "InvalidResultHash");
    await expect(
      hub
        .connect(provider)
        .consumeGrantAndIssueReceipt(
          g,
          sig,
          buildReceipt({ attestationDigest: ethers.ZeroHash }),
        ),
    ).to.be.revertedWithCustomError(hub, "InvalidAttestationDigest");
  });

  it("rejects expired receipt at issuance", async function () {
    const { hub, deployer, maria, provider, chainId, mariaTokenId } = await deploy();
    await registerHelpPolicy(hub, deployer);
    const g = buildGrant({ providerAddress: await provider.getAddress(), agentTokenId: mariaTokenId });
    const sig = await signGrant(maria, await hub.getAddress(), chainId, g);
    const r = buildReceipt({ receiptExpiry: BigInt(Math.floor(Date.now() / 1000) - 60) });
    await expect(
      hub.connect(provider).consumeGrantAndIssueReceipt(g, sig, r),
    ).to.be.revertedWithCustomError(hub, "ReceiptExpired");
  });

  it("rejects duplicate receiptId across distinct grants", async function () {
    const { hub, deployer, maria, provider, chainId, mariaTokenId } = await deploy();
    await registerHelpPolicy(hub, deployer);
    const g1 = buildGrant({ providerAddress: await provider.getAddress(), agentTokenId: mariaTokenId, nonce: 1n });
    const g2 = buildGrant({ providerAddress: await provider.getAddress(), agentTokenId: mariaTokenId, nonce: 2n });
    const sharedReceiptId = ethers.keccak256(ethers.toUtf8Bytes("dupe"));
    const r1 = buildReceipt({ receiptId: sharedReceiptId });
    const r2 = buildReceipt({ receiptId: sharedReceiptId });
    const sig1 = await signGrant(maria, await hub.getAddress(), chainId, g1);
    const sig2 = await signGrant(maria, await hub.getAddress(), chainId, g2);

    await hub.connect(provider).consumeGrantAndIssueReceipt(g1, sig1, r1);
    await expect(
      hub.connect(provider).consumeGrantAndIssueReceipt(g2, sig2, r2),
    ).to.be.revertedWithCustomError(hub, "ReceiptAlreadyIssued");
  });

  it("propagates ERC721 nonexistent-token revert when agent doesn't exist", async function () {
    const { hub, deployer, maria, provider, chainId } = await deploy();
    await registerHelpPolicy(hub, deployer);
    const g = buildGrant({ providerAddress: await provider.getAddress(), agentTokenId: 999n });
    const r = buildReceipt();
    const sig = await signGrant(maria, await hub.getAddress(), chainId, g);
    await expect(hub.connect(provider).consumeGrantAndIssueReceipt(g, sig, r)).to.be.reverted;
  });
});
