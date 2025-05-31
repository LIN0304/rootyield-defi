const hre = require("hardhat");
const fs = require("fs");

async function main() {
  // Load deployment addresses
  const deploymentPath = `deployments/${hre.network.name}.json`;
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ No deployment found for this network. Run deploy script first.");
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const [signer] = await hre.ethers.getSigners();
  
  console.log("🔍 Checking rewards for:", signer.address);
  
  // Get contracts
  const yieldFarm = await hre.ethers.getContractAt("YieldFarm", deployment.contracts.YieldFarm);
  const ryldToken = await hre.ethers.getContractAt("RYLDToken", deployment.contracts.RYLDToken);
  
  try {
    // Get user info
    const userInfo = await yieldFarm.getUserInfo(signer.address);
    const pendingRewards = await yieldFarm.getPendingRewards(signer.address);
    const ryldBalance = await ryldToken.balanceOf(signer.address);
    
    // Get contract stats
    const totalStaked = await yieldFarm.totalStaked();
    const rewardPerBlock = await yieldFarm.rewardPerBlock();
    
    console.log("\n📊 Your Staking Stats:");
    console.log("   Staked Amount:", hre.ethers.utils.formatEther(userInfo[0]), "RBTC");
    console.log("   Pending Rewards:", hre.ethers.utils.formatEther(pendingRewards), "RYLD");
    console.log("   RYLD Balance:", hre.ethers.utils.formatEther(ryldBalance), "RYLD");
    console.log("   Last Stake Time:", new Date(userInfo[2] * 1000).toLocaleString());
    
    console.log("\n🌐 Pool Stats:");
    console.log("   Total Staked:", hre.ethers.utils.formatEther(totalStaked), "RBTC");
    console.log("   Rewards Per Block:", hre.ethers.utils.formatEther(rewardPerBlock), "RYLD");
    
    // Calculate APY
    const blocksPerYear = 2628000; // Approximate blocks per year on RSK
    const yearlyRewards = rewardPerBlock.mul(blocksPerYear);
    if (totalStaked.gt(0)) {
      const apy = yearlyRewards.mul(10000).div(totalStaked).toNumber() / 100;
      console.log("   Estimated APY:", apy.toFixed(2) + "%");
    }
    
  } catch (error) {
    console.error("❌ Error checking rewards:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
