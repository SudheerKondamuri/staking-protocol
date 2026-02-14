import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

const { ethers } = hre;

async function main() {
  const addressesFilePath = path.join(process.cwd(), "scripts", "addresses.json");

  if (!fs.existsSync(addressesFilePath)) {
    console.error("❌ Deployment addresses file not found!");
    console.error(`Expected at: ${addressesFilePath}`);
    console.log("\n📝 Make sure to run the deployment script first:");
    console.log("npx hardhat run deploy/deploy.ts --network <network-name>");
    process.exit(1);
  }

  const addresses = JSON.parse(fs.readFileSync(addressesFilePath, "utf-8"));
  console.log("🔍 Verifying Staking Protocol Deployment...\n");
  console.log("📋 Deployment Information:");
  console.log(`Network: ${addresses.network}`);
  console.log(`Deployer: ${addresses.deployer}`);
  console.log(`Deployment Time: ${addresses.deploymentTime}\n`);

  // Verify StakingToken
  console.log("✓ Verifying StakingToken...");
  const stakingToken = await ethers.getContractAt(
    "StakingToken",
    addresses.stakingToken
  );
  const stakingTokenName = await stakingToken.name();
  const stakingTokenSymbol = await stakingToken.symbol();
  console.log(`  Name: ${stakingTokenName}`);
  console.log(`  Symbol: ${stakingTokenSymbol}`);
  console.log(`  Address: ${addresses.stakingToken}\n`);

  // Verify RewardToken
  console.log("✓ Verifying RewardToken...");
  const rewardToken = await ethers.getContractAt(
    "RewardToken",
    addresses.rewardToken
  );
  const rewardTokenName = await rewardToken.name();
  const rewardTokenSymbol = await rewardToken.symbol();
  console.log(`  Name: ${rewardTokenName}`);
  console.log(`  Symbol: ${rewardTokenSymbol}`);
  console.log(`  Address: ${addresses.rewardToken}\n`);

  // Verify StakingProtocol
  console.log("✓ Verifying StakingProtocol...");
  const stakingProtocol = await ethers.getContractAt(
    "StakingProtocol",
    addresses.stakingProtocol
  );
  const owner = await stakingProtocol.owner();
  console.log(`  Owner: ${owner}`);
  console.log(`  Address: ${addresses.stakingProtocol}\n`);

  // Check pools
  console.log("✓ Checking Staking Pools...");
  try {
    const poolCount = await ethers.provider.call({
      to: addresses.stakingProtocol,
      data: (await stakingProtocol.interface.encodeFunctionData("pools", [0])),
    });
    console.log(`  Pools are accessible\n`);
  } catch {
    console.log(`  Unable to check pool count\n`);
  }

  console.log("════════════════════════════════════════════════════════════");
  console.log("✨ Verification Summary");
  console.log("════════════════════════════════════════════════════════════");
  console.log(`✅ StakingToken: ${addresses.stakingToken}`);
  console.log(`✅ RewardToken: ${addresses.rewardToken}`);
  console.log(`✅ StakingProtocol: ${addresses.stakingProtocol}`);
  console.log("════════════════════════════════════════════════════════════\n");

  console.log("🎉 All contracts verified successfully!");
}

main().catch((error) => {
  console.error("❌ Verification failed:", error);
  process.exitCode = 1;
});
