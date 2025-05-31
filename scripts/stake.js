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
  console.log("💰 Account balance:", hre.ethers.utils.formatEther(await signer.getBalance()), "RBTC");
  
  // Get contracts
  const yieldFarm = await hre.ethers.getContractAt("YieldFarm", deployment.contracts.YieldFarm);
  
  // Stake amount (0.01 RBTC for testing)
  const stakeAmount = hre.ethers.utils.parseEther("0.01");
  
  console.log("\n🌾 Staking", hre.ethers.utils.formatEther(stakeAmount), "RBTC...");
  
  try {
    const tx = await yieldFarm.stake({ value: stakeAmount });
    console.log("📤 Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    
    // Get updated user info
    const userInfo = await yieldFarm.getUserInfo(signer.address);
    console.log("\n📊 Your staking info:");
    console.log("   Staked:", hre.ethers.utils.formatEther(userInfo[0]), "RBTC");
    console.log("   Pending rewards:", hre.ethers.utils.formatEther(userInfo[1]), "RYLD");
    
  } catch (error) {
    console.error("❌ Error staking:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
