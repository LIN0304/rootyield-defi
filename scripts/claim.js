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
  
  console.log("🔍 Using account:", signer.address);
  
  // Get contracts
  const yieldFarm = await hre.ethers.getContractAt("YieldFarm", deployment.contracts.YieldFarm);
  const ryldToken = await hre.ethers.getContractAt("RYLDToken", deployment.contracts.RYLDToken);
  
  try {
    // Check pending rewards
    const pendingRewards = await yieldFarm.getPendingRewards(signer.address);
    console.log("\n💰 Pending rewards:", hre.ethers.utils.formatEther(pendingRewards), "RYLD");
    
    if (pendingRewards.eq(0)) {
      console.log("❌ No rewards to claim");
      return;
    }
    
    // Get balance before
    const balanceBefore = await ryldToken.balanceOf(signer.address);
    
    // Claim rewards
    console.log("\n🎁 Claiming rewards...");
    const tx = await yieldFarm.claimRewards();
    console.log("📤 Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    
    // Get balance after
    const balanceAfter = await ryldToken.balanceOf(signer.address);
    const claimed = balanceAfter.sub(balanceBefore);
    
    console.log("\n✨ Successfully claimed:", hre.ethers.utils.formatEther(claimed), "RYLD");
    console.log("💰 New RYLD balance:", hre.ethers.utils.formatEther(balanceAfter), "RYLD");
    
  } catch (error) {
    console.error("❌ Error claiming rewards:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
