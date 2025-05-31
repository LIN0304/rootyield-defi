// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./RYLDToken.sol";

/**
 * @title YieldFarm
 * @dev Main yield farming contract for RBTC staking on Rootstock
 */
contract YieldFarm is Ownable, ReentrancyGuard, Pausable {
    using SafeMath for uint256;

    RYLDToken public ryldToken;
    
    uint256 public constant REWARD_PRECISION = 1e18;
    uint256 public rewardPerBlock = 100 * 1e18; // 100 RYLD per block
    uint256 public totalStaked;
    uint256 public lastRewardBlock;
    uint256 public accRewardPerShare;
    
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 pendingRewards;
        uint256 lastStakeTime;
    }
    
    mapping(address => UserInfo) public userInfo;
    
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 newRate);
    
    constructor(address _ryldToken) {
        ryldToken = RYLDToken(_ryldToken);
        lastRewardBlock = block.number;
    }
    
    /**
     * @dev Updates reward variables
     */
    function updatePool() public {
        if (block.number <= lastRewardBlock) {
            return;
        }
        
        if (totalStaked == 0) {
            lastRewardBlock = block.number;
            return;
        }
        
        uint256 blocksSinceLastReward = block.number.sub(lastRewardBlock);
        uint256 ryldReward = blocksSinceLastReward.mul(rewardPerBlock);
        
        // Mint rewards to this contract
        ryldToken.mint(address(this), ryldReward);
        
        accRewardPerShare = accRewardPerShare.add(
            ryldReward.mul(REWARD_PRECISION).div(totalStaked)
        );
        
        lastRewardBlock = block.number;
    }
    
    /**
     * @dev Stake RBTC to earn RYLD
     */
    function stake() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Cannot stake 0 RBTC");
        
        updatePool();
        
        UserInfo storage user = userInfo[msg.sender];
        
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(accRewardPerShare).div(REWARD_PRECISION).sub(user.rewardDebt);
            if (pending > 0) {
                user.pendingRewards = user.pendingRewards.add(pending);
            }
        }
        
        user.amount = user.amount.add(msg.value);
        user.rewardDebt = user.amount.mul(accRewardPerShare).div(REWARD_PRECISION);
        user.lastStakeTime = block.timestamp;
        
        totalStaked = totalStaked.add(msg.value);
        
        emit Staked(msg.sender, msg.value);
    }
    
    /**
     * @dev Withdraw staked RBTC
     */
    function withdraw(uint256 _amount) external nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        require(user.amount >= _amount, "Insufficient staked amount");
        
        updatePool();
        
        uint256 pending = user.amount.mul(accRewardPerShare).div(REWARD_PRECISION).sub(user.rewardDebt);
        if (pending > 0) {
            user.pendingRewards = user.pendingRewards.add(pending);
        }
        
        user.amount = user.amount.sub(_amount);
        user.rewardDebt = user.amount.mul(accRewardPerShare).div(REWARD_PRECISION);
        
        totalStaked = totalStaked.sub(_amount);
        
        // Transfer RBTC back to user
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "RBTC transfer failed");
        
        emit Withdrawn(msg.sender, _amount);
    }
    
    /**
     * @dev Claim pending RYLD rewards
     */
    function claimRewards() external nonReentrant {
        updatePool();
        
        UserInfo storage user = userInfo[msg.sender];
        
        uint256 pending = user.amount.mul(accRewardPerShare).div(REWARD_PRECISION).sub(user.rewardDebt);
        uint256 totalRewards = pending.add(user.pendingRewards);
        
        require(totalRewards > 0, "No rewards to claim");
        
        user.rewardDebt = user.amount.mul(accRewardPerShare).div(REWARD_PRECISION);
        user.pendingRewards = 0;
        
        // Transfer RYLD rewards
        ryldToken.transfer(msg.sender, totalRewards);
        
        emit RewardsClaimed(msg.sender, totalRewards);
    }
    
    /**
     * @dev Get pending rewards for a user
     */
    function getPendingRewards(address _user) external view returns (uint256) {
        UserInfo storage user = userInfo[_user];
        
        uint256 _accRewardPerShare = accRewardPerShare;
        if (block.number > lastRewardBlock && totalStaked > 0) {
            uint256 blocksSinceLastReward = block.number.sub(lastRewardBlock);
            uint256 ryldReward = blocksSinceLastReward.mul(rewardPerBlock);
            _accRewardPerShare = _accRewardPerShare.add(
                ryldReward.mul(REWARD_PRECISION).div(totalStaked)
            );
        }
        
        uint256 pending = user.amount.mul(_accRewardPerShare).div(REWARD_PRECISION).sub(user.rewardDebt);
        return pending.add(user.pendingRewards);
    }
    
    /**
     * @dev Emergency withdraw without caring about rewards
     */
    function emergencyWithdraw() external nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        uint256 amount = user.amount;
        
        require(amount > 0, "No staked amount");
        
        user.amount = 0;
        user.rewardDebt = 0;
        user.pendingRewards = 0;
        
        totalStaked = totalStaked.sub(amount);
        
        // Transfer RBTC back to user
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "RBTC transfer failed");
        
        emit EmergencyWithdraw(msg.sender, amount);
    }
    
    /**
     * @dev Update reward rate (only owner)
     */
    function updateRewardRate(uint256 _rewardPerBlock) external onlyOwner {
        updatePool();
        rewardPerBlock = _rewardPerBlock;
        emit RewardRateUpdated(_rewardPerBlock);
    }
    
    /**
     * @dev Pause/unpause contract (only owner)
     */
    function setPaused(bool _paused) external onlyOwner {
        if (_paused) {
            _pause();
        } else {
            _unpause();
        }
    }
    
    /**
     * @dev Get user staking info
     */
    function getUserInfo(address _user) external view returns (
        uint256 stakedAmount,
        uint256 pendingRewards,
        uint256 lastStakeTime
    ) {
        UserInfo storage user = userInfo[_user];
        return (
            user.amount,
            this.getPendingRewards(_user),
            user.lastStakeTime
        );
    }
    
    /**
     * @dev Get contract stats
     */
    function getContractStats() external view returns (
        uint256 _totalStaked,
        uint256 _rewardPerBlock,
        uint256 _ryldBalance
    ) {
        return (
            totalStaked,
            rewardPerBlock,
            ryldToken.balanceOf(address(this))
        );
    }
    
    receive() external payable {
        revert("Please use stake() function");
    }
}
