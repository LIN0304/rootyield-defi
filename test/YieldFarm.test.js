const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RootYield Protocol", function () {
  let owner, user1, user2;
  let ryldToken, yieldFarm, liquidityPool;
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy RYLD Token
    const RYLDToken = await ethers.getContractFactory("RYLDToken");
    ryldToken = await RYLDToken.deploy();
    await ryldToken.deployed();
    
    // Deploy YieldFarm
    const YieldFarm = await ethers.getContractFactory("YieldFarm");
    yieldFarm = await YieldFarm.deploy(ryldToken.address);
    await yieldFarm.deployed();
    
    // Deploy LiquidityPool
    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    liquidityPool = await LiquidityPool.deploy(ryldToken.address);
    await liquidityPool.deployed();
    
    // Setup permissions
    const MINTER_ROLE = await ryldToken.MINTER_ROLE();
    await ryldToken.grantRole(MINTER_ROLE, yieldFarm.address);
    
    // Add initial liquidity
    const initialRBTC = ethers.utils.parseEther("1");
    const initialRYLD = ethers.utils.parseEther("10000");
    await ryldToken.approve(liquidityPool.address, initialRYLD);
    await liquidityPool.addLiquidity(initialRYLD, { value: initialRBTC });
  });
  
  describe("RYLD Token", function () {
    it("Should have correct name and symbol", async function () {
      expect(await ryldToken.name()).to.equal("RootYield Token");
      expect(await ryldToken.symbol()).to.equal("RYLD");
    });
    
    it("Should mint initial supply to owner", async function () {
      const initialSupply = ethers.utils.parseEther("40000000");
      expect(await ryldToken.balanceOf(owner.address)).to.be.gte(initialSupply);
    });
    
    it("Should not exceed max supply", async function () {
      const maxSupply = ethers.utils.parseEther("100000000");
      const currentSupply = await ryldToken.totalSupply();
      const mintAmount = maxSupply.sub(currentSupply).add(1);
      
      await expect(
        ryldToken.mint(user1.address, mintAmount)
      ).to.be.revertedWith("Max supply exceeded");
    });
  });
  
  describe("YieldFarm", function () {
    it("Should stake RBTC", async function () {
      const stakeAmount = ethers.utils.parseEther("0.1");
      
      await expect(
        yieldFarm.connect(user1).stake({ value: stakeAmount })
      ).to.emit(yieldFarm, "Staked")
        .withArgs(user1.address, stakeAmount);
      
      const userInfo = await yieldFarm.getUserInfo(user1.address);
      expect(userInfo[0]).to.equal(stakeAmount);
    });
    
    it("Should accumulate rewards", async function () {
      const stakeAmount = ethers.utils.parseEther("0.1");
      await yieldFarm.connect(user1).stake({ value: stakeAmount });
      
      // Mine some blocks
      for (let i = 0; i < 10; i++) {
        await ethers.provider.send("evm_mine", []);
      }
      
      const pendingRewards = await yieldFarm.getPendingRewards(user1.address);
      expect(pendingRewards).to.be.gt(0);
    });
    
    it("Should withdraw staked RBTC", async function () {
      const stakeAmount = ethers.utils.parseEther("0.1");
      await yieldFarm.connect(user1).stake({ value: stakeAmount });
      
      const balanceBefore = await user1.getBalance();
      
      await expect(
        yieldFarm.connect(user1).withdraw(stakeAmount)
      ).to.emit(yieldFarm, "Withdrawn")
        .withArgs(user1.address, stakeAmount);
      
      const balanceAfter = await user1.getBalance();
      expect(balanceAfter).to.be.gt(balanceBefore);
    });
    
    it("Should claim rewards", async function () {
      const stakeAmount = ethers.utils.parseEther("0.1");
      await yieldFarm.connect(user1).stake({ value: stakeAmount });
      
      // Mine some blocks
      for (let i = 0; i < 10; i++) {
        await ethers.provider.send("evm_mine", []);
      }
      
      await expect(
        yieldFarm.connect(user1).claimRewards()
      ).to.emit(yieldFarm, "RewardsClaimed");
      
      const ryldBalance = await ryldToken.balanceOf(user1.address);
      expect(ryldBalance).to.be.gt(0);
    });
    
    it("Should handle emergency withdraw", async function () {
      const stakeAmount = ethers.utils.parseEther("0.1");
      await yieldFarm.connect(user1).stake({ value: stakeAmount });
      
      await expect(
        yieldFarm.connect(user1).emergencyWithdraw()
      ).to.emit(yieldFarm, "EmergencyWithdraw")
        .withArgs(user1.address, stakeAmount);
      
      const userInfo = await yieldFarm.getUserInfo(user1.address);
      expect(userInfo[0]).to.equal(0);
    });
  });
  
  describe("LiquidityPool", function () {
    it("Should add liquidity", async function () {
      const rbtcAmount = ethers.utils.parseEther("0.1");
      const ryldAmount = ethers.utils.parseEther("1000");
      
      await ryldToken.connect(owner).transfer(user1.address, ryldAmount);
      await ryldToken.connect(user1).approve(liquidityPool.address, ryldAmount);
      
      await expect(
        liquidityPool.connect(user1).addLiquidity(ryldAmount, { value: rbtcAmount })
      ).to.emit(liquidityPool, "LiquidityAdded");
      
      expect(await liquidityPool.liquidity(user1.address)).to.be.gt(0);
    });
    
    it("Should swap RBTC for RYLD", async function () {
      const swapAmount = ethers.utils.parseEther("0.01");
      
      const ryldBalanceBefore = await ryldToken.balanceOf(user1.address);
      
      await expect(
        liquidityPool.connect(user1).swapRBTCForRYLD({ value: swapAmount })
      ).to.emit(liquidityPool, "Swap");
      
      const ryldBalanceAfter = await ryldToken.balanceOf(user1.address);
      expect(ryldBalanceAfter).to.be.gt(ryldBalanceBefore);
    });
    
    it("Should swap RYLD for RBTC", async function () {
      const ryldAmount = ethers.utils.parseEther("100");
      
      // Give user1 some RYLD
      await ryldToken.transfer(user1.address, ryldAmount);
      await ryldToken.connect(user1).approve(liquidityPool.address, ryldAmount);
      
      const rbtcBalanceBefore = await user1.getBalance();
      
      await expect(
        liquidityPool.connect(user1).swapRYLDForRBTC(ryldAmount)
      ).to.emit(liquidityPool, "Swap");
      
      const rbtcBalanceAfter = await user1.getBalance();
      expect(rbtcBalanceAfter).to.be.gt(rbtcBalanceBefore);
    });
    
    it("Should remove liquidity", async function () {
      // First add liquidity
      const rbtcAmount = ethers.utils.parseEther("0.1");
      const ryldAmount = ethers.utils.parseEther("1000");
      
      await ryldToken.transfer(user1.address, ryldAmount);
      await ryldToken.connect(user1).approve(liquidityPool.address, ryldAmount);
      await liquidityPool.connect(user1).addLiquidity(ryldAmount, { value: rbtcAmount });
      
      const liquidityBalance = await liquidityPool.liquidity(user1.address);
      
      await expect(
        liquidityPool.connect(user1).removeLiquidity(liquidityBalance)
      ).to.emit(liquidityPool, "LiquidityRemoved");
      
      expect(await liquidityPool.liquidity(user1.address)).to.equal(0);
    });
  });
  
  describe("Integration Tests", function () {
    it("Should handle complete user flow", async function () {
      // 1. Stake RBTC
      const stakeAmount = ethers.utils.parseEther("0.5");
      await yieldFarm.connect(user1).stake({ value: stakeAmount });
      
      // 2. Mine blocks to accumulate rewards
      for (let i = 0; i < 20; i++) {
        await ethers.provider.send("evm_mine", []);
      }
      
      // 3. Claim rewards
      await yieldFarm.connect(user1).claimRewards();
      const ryldBalance = await ryldToken.balanceOf(user1.address);
      expect(ryldBalance).to.be.gt(0);
      
      // 4. Swap some RYLD for RBTC
      const swapAmount = ryldBalance.div(2);
      await ryldToken.connect(user1).approve(liquidityPool.address, swapAmount);
      await liquidityPool.connect(user1).swapRYLDForRBTC(swapAmount);
      
      // 5. Withdraw staked RBTC
      await yieldFarm.connect(user1).withdraw(stakeAmount);
      
      // Verify final state
      const finalUserInfo = await yieldFarm.getUserInfo(user1.address);
      expect(finalUserInfo[0]).to.equal(0);
      expect(await ryldToken.balanceOf(user1.address)).to.be.gt(0);
    });
  });
});
