import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentAddresses {
  stakingToken: string;
  rewardToken: string;
  stakingProtocol: string;
  deployer: string;
  deploymentTime: string;
  network: string;
}

async function main() {
  console.log("🚀 Starting Staking Protocol Deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📦 Deploying contracts with account: ${deployer.address}`);

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})\n`);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceInEther = ethers.formatEther(balance);
  console.log(`💰 Account balance: ${balanceInEther} ETH\n`);

  // Deploy StakingToken
  console.log("📝 Deploying StakingToken...");
  const StakingToken = await ethers.getContractFactory("StakingToken");
  const stakingToken = await StakingToken.deploy("Staking Token", "STK");
  await stakingToken.waitForDeployment();
  const stakingTokenAddress = await stakingToken.getAddress();
  console.log(`✅ StakingToken deployed to: ${stakingTokenAddress}\n`);

  // Deploy RewardToken
  console.log("📝 Deploying RewardToken...");
  const RewardToken = await ethers.getContractFactory("RewardToken");
  const rewardToken = await RewardToken.deploy("Reward Token", "RWD");
  await rewardToken.waitForDeployment();
  const rewardTokenAddress = await rewardToken.getAddress();
  console.log(`✅ RewardToken deployed to: ${rewardTokenAddress}\n`);

  // Deploy StakingProtocol
  console.log("📝 Deploying StakingProtocol...");
  const StakingProtocol = await ethers.getContractFactory("StakingProtocol");
  const stakingProtocol = await StakingProtocol.deploy(
    stakingTokenAddress,
    rewardTokenAddress
  );
  await stakingProtocol.waitForDeployment();
  const stakingProtocolAddress = await stakingProtocol.getAddress();
  console.log(`✅ StakingProtocol deployed to: ${stakingProtocolAddress}\n`);

  // Prepare deployment addresses object
  const deploymentAddresses: DeploymentAddresses = {
    stakingToken: stakingTokenAddress,
    rewardToken: rewardTokenAddress,
    stakingProtocol: stakingProtocolAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    network: network.name,
  };

  // Save deployment addresses to file
  const addressesFilePath = path.join(process.cwd(), "scripts", "addresses.json");

  fs.writeFileSync(
    addressesFilePath,
    JSON.stringify(deploymentAddresses, null, 2)
  );
  console.log(`💾 Deployment addresses saved to: ${addressesFilePath}\n`);

  // Summary
  console.log("════════════════════════════════════════════════════════════");
  console.log("✨ Deployment Summary");
  console.log("════════════════════════════════════════════════════════════");
  console.log(`Network: ${deploymentAddresses.network}`);
  console.log(`Deployer: ${deploymentAddresses.deployer}`);
  console.log(`StakingToken: ${deploymentAddresses.stakingToken}`);
  console.log(`RewardToken: ${deploymentAddresses.rewardToken}`);
  console.log(`StakingProtocol: ${deploymentAddresses.stakingProtocol}`);
  console.log(`Deployment Time: ${deploymentAddresses.deploymentTime}`);
  console.log("════════════════════════════════════════════════════════════\n");

  // Optional: Create pools
  console.log("🏊 Creating initial staking pools...");
  const tx1 = await stakingProtocol.createPool(10, 2592000, false); // 10% APY, 30 days lock
  await tx1.wait();
  console.log("✅ Created Fixed Pool: 10% APY, 30 days lock\n");

  const tx2 = await stakingProtocol.createPool(5, 0, true); // 5% APY, flexible
  await tx2.wait();
  console.log("✅ Created Flexible Pool: 5% APY, no lock period\n");

  console.log("🎉 Deployment completed successfully!");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
