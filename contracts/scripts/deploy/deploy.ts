import { ethers, network } from "hardhat";
import { writeFileSync, mkdirSync, existsSync, renameSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { inspect } from "node:util";

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer:   ${deployer.address}`);
  console.log(`Network:    ${network.name} (chainId ${network.config.chainId})`);
  console.log(`Balance:    ${ethers.formatEther(balance)} OG`);

  const outPath = resolve(__dirname, "../../../docs/deployments", `${network.name}.json`);
  if (existsSync(outPath) && process.env.OVERWRITE !== "1") {
    throw new Error(
      `Deployment manifest already exists at ${outPath}. Set OVERWRITE=1 to replace.`,
    );
  }
  if (existsSync(outPath)) {
    const archive = outPath.replace(/\.json$/, `.${Date.now()}.json`);
    renameSync(outPath, archive);
    console.warn(`[deploy] existing manifest archived to ${archive}`);
  }
  mkdirSync(dirname(outPath), { recursive: true });

  const out: {
    network: string;
    chainId: number | undefined;
    deployer: string;
    deployedAt: string;
    contracts: Record<string, string>;
  } = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {},
  };
  const writePartial = () => writeFileSync(outPath, JSON.stringify(out, null, 2));

  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  out.contracts.AgentRegistry = await agentRegistry.getAddress();
  writePartial();
  console.log(`AgentRegistry deployed: ${out.contracts.AgentRegistry}`);

  const CompassHub = await ethers.getContractFactory("CompassHub");
  const compassHub = await CompassHub.deploy(out.contracts.AgentRegistry);
  await compassHub.waitForDeployment();
  out.contracts.CompassHub = await compassHub.getAddress();
  writePartial();
  console.log(`CompassHub deployed:    ${out.contracts.CompassHub}`);

  console.log(`Saved: ${outPath}`);
}

main().catch((e) => {
  console.error(inspect(e, { depth: null, colors: false }));
  process.exit(1);
});
