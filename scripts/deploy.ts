import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy"; // <-- THIS IS THE FIX FOR THE TYPESCRIPT ERRORS
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("====================================================");
  console.log("🚀 Deploying contracts with account:", deployer);
  console.log("====================================================");

  // 1. Deploy Staking Token
  const stakingTokenDeploy = await deploy("StakingToken", {
    from: deployer,
    args: ["Staking Token", "STK"], // Constructor arguments: Name, Symbol
    log: true,
  });

  // 2. Deploy Reward Token
  const rewardTokenDeploy = await deploy("RewardToken", {
    from: deployer,
    args: ["Reward Token", "RWD"], // Constructor arguments: Name, Symbol
    log: true,
  });

  // 3. Deploy Staking Protocol
  const protocolDeploy = await deploy("StakingProtocol", {
    from: deployer,
    args: [stakingTokenDeploy.address, rewardTokenDeploy.address],
    log: true,
  });

  // ====================================================
  // ⚙️ INITIALIZATION & SETUP
  // ====================================================
  console.log("\n⚙️ Setting up the Protocol...");

  // Get the deployed contract instances to interact with them
  const rewardToken = await ethers.getContractAt("RewardToken", rewardTokenDeploy.address);
  const protocol = await ethers.getContractAt("StakingProtocol", protocolDeploy.address);

  // A. Fund the protocol with 1,000,000 RWD tokens for payouts
  console.log("-> Transferring 1,000,000 Reward Tokens to Protocol...");
  const fundAmount = ethers.parseEther("1000000");

  // Check protocol balance to prevent failing if we are redeploying over existing state
  const protocolBal = await rewardToken.balanceOf(protocolDeploy.address);
  if (protocolBal === 0n) {
    const fundTx = await rewardToken.transfer(protocolDeploy.address, fundAmount);
    await fundTx.wait();
    console.log("   ✅ Protocol funded.");
  } else {
    console.log("   ⏭️ Protocol already funded.");
  }

  // B. Create Default Pools
  console.log("-> Creating Staking Pools...");

  // Check how many pools exist to avoid duplicate creation on script re-runs
  const poolCount = await protocol.poolCount();

  if (poolCount === 0n) {
    // Pool 0: Flexible, 10% APY, 0 Days Lock
    console.log("   -> Creating Pool 0 (Flexible)...");
    const tx1 = await protocol.createPool(10, 0, true);
    await tx1.wait();

    // Pool 1: Locked, 15% APY, 30 Days Lock (30 * 24 * 60 * 60 = 2592000 seconds)
    console.log("   -> Creating Pool 1 (Locked 30 Days)...");
    const tx2 = await protocol.createPool(15, 2592000, false);
    await tx2.wait();

    console.log("   ✅ Pools created successfully.");
  } else {
    console.log(`   ⏭️ Pools already exist (${poolCount} pools found).`);
  }

  console.log("\n🎉 DEPLOYMENT COMPLETE 🎉");
  console.log("----------------------------------------------------");
  console.log(`Staking Token:    ${stakingTokenDeploy.address}`);
  console.log(`Reward Token:     ${rewardTokenDeploy.address}`);
  console.log(`Staking Protocol: ${protocolDeploy.address}`);
  console.log("----------------------------------------------------");

  // Output addresses to frontend/.env
  const fs = require("fs");
  const path = require("path");
  const envPath = path.join(__dirname, "..", "frontend", ".env");
  const envContent = `NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=${protocolDeploy.address}\nNEXT_PUBLIC_STAKING_TOKEN_ADDRESS=${stakingTokenDeploy.address}\nNEXT_PUBLIC_RPC_URL=http://localhost:8545\n`;
  fs.writeFileSync(envPath, envContent);
  console.log("✅ Updated frontend/.env with new contract addresses.");
};

export default func;
func.tags = ["StakingProtocol"];