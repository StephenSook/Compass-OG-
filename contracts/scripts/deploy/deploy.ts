import { ethers, network } from "hardhat";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer:   ${deployer.address}`);
  console.log(`Network:    ${network.name} (chainId ${network.config.chainId})`);
  console.log(`Balance:    ${ethers.formatEther(balance)} OG`);

  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  const agentRegistryAddr = await agentRegistry.getAddress();
  console.log(`AgentRegistry deployed: ${agentRegistryAddr}`);

  const CompassHub = await ethers.getContractFactory("CompassHub");
  const compassHub = await CompassHub.deploy(agentRegistryAddr);
  await compassHub.waitForDeployment();
  const compassHubAddr = await compassHub.getAddress();
  console.log(`CompassHub deployed:    ${compassHubAddr}`);

  const out = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      AgentRegistry: agentRegistryAddr,
      CompassHub: compassHubAddr,
    },
  };
  const outPath = resolve(__dirname, "../../../docs/deployments", `${network.name}.json`);
  if (!existsSync(dirname(outPath))) mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Saved: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
