import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments } = hre;
  const { deploy } = deployments;
  
  // FIX: Get the deployer address directly from ethers instead of namedAccounts
  const signers = await ethers.getSigners();
  const deployer = signers[0].address;

  console.log("====================================================");
  console.log("🚀 Deploying contracts with account:", deployer);
  console.log("====================================================");

  // 1. Deploy Staking Token
  const stakingTokenDeploy = await deploy("StakingToken", {
    from: deployer,
    args: ["Staking Token", "STK"], 
    log: true,
  });

  // 2. Deploy Reward Token
  const rewardTokenDeploy = await deploy("RewardToken", {
    from: deployer,
    args: ["Reward Token", "RWD"], 
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

  const rewardToken = await ethers.getContractAt("RewardToken", rewardTokenDeploy.address);
  const protocol = await ethers.getContractAt("StakingProtocol", protocolDeploy.address);

  // A. Fund the protocol with 1,000,000 RWD tokens for payouts
  console.log("-> Transferring 1,000,000 Reward Tokens to Protocol...");
  const fundAmount = ethers.parseEther("1000000");
  
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
  const poolCount = await protocol.poolCount();
  
  if (poolCount === 0n) {
      console.log("   -> Creating Pool 0 (Flexible)...");
      const tx1 = await protocol.createPool(10, 0, true);
      await tx1.wait();

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
};

export default func;
func.tags = ["StakingProtocol"];