const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting RootYield deployment on Rootstock...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  
  // Deploy RYLD Token
  console.log("\n📄 Deploying RYLD Token...");
  const RYLDToken = await hre.ethers.getContractFactory("RYLDToken");
  const ryldToken = await RYLDToken.deploy();
  await ryldToken.deployed();
  console.log("✅ RYLD Token deployed to:", ryldToken.address);
  
  // Deploy YieldFarm
  console.log("\n🌾 Deploying YieldFarm...");
  const YieldFarm = await hre.ethers.getContractFactory("YieldFarm");
  const yieldFarm = await YieldFarm.deploy(ryldToken.address);
  await yieldFarm.deployed();
  console.log("✅ YieldFarm deployed to:", yieldFarm.address);
  
  // Deploy LiquidityPool
  console.log("\n💧 Deploying LiquidityPool...");
  const LiquidityPool = await hre.ethers.getContractFactory("LiquidityPool");
  const liquidityPool = await LiquidityPool.deploy(ryldToken.address);
  await liquidityPool.deployed();
  console.log("✅ LiquidityPool deployed to:", liquidityPool.address);
  
  // Setup: Grant minter role to YieldFarm
  console.log("\n🔧 Setting up contracts...");
  const MINTER_ROLE = await ryldToken.MINTER_ROLE();
  await ryldToken.grantRole(MINTER_ROLE, yieldFarm.address);
  console.log("✅ Granted MINTER_ROLE to YieldFarm");
  
  // Exclude contracts from fees
  await ryldToken.setExcludedFromFees(yieldFarm.address, true);
  await ryldToken.setExcludedFromFees(liquidityPool.address, true);
  console.log("✅ Excluded contracts from fees");
  
  // Initial liquidity provision (optional, for testing)
  const initialRBTC = hre.ethers.utils.parseEther("0.1"); // 0.1 RBTC
  const initialRYLD = hre.ethers.utils.parseEther("1000"); // 1000 RYLD
  
  console.log("\n💰 Adding initial liquidity...");
  await ryldToken.approve(liquidityPool.address, initialRYLD);
  await liquidityPool.addLiquidity(initialRYLD, { value: initialRBTC });
  console.log("✅ Added initial liquidity");
  
  // Save deployment addresses
  const deployment = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      RYLDToken: ryldToken.address,
      YieldFarm: yieldFarm.address,
      LiquidityPool: liquidityPool.address
    },
    deployer: deployer.address
  };
  
  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deployment, null, 2));
  
  // Write deployment info to file
  const fs = require("fs");
  fs.writeFileSync(
    `deployments/${hre.network.name}.json`,
    JSON.stringify(deployment, null, 2)
  );
  
  console.log("\n✅ Deployment completed successfully!");
  console.log("\n🔍 Verify contracts on explorer:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${ryldToken.address}`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${yieldFarm.address} \"${ryldToken.address}\"`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${liquidityPool.address} \"${ryldToken.address}\"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
