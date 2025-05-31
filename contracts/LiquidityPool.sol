// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title LiquidityPool
 * @dev Simple AMM liquidity pool for RBTC/RYLD pair
 */
contract LiquidityPool is ReentrancyGuard, Ownable {
    using SafeMath for uint256;
    
    IERC20 public ryldToken;
    
    uint256 public totalLiquidity;
    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    uint256 public constant FEE_PERCENT = 30; // 0.3%
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    mapping(address => uint256) public liquidity;
    
    event LiquidityAdded(address indexed provider, uint256 rbtcAmount, uint256 ryldAmount, uint256 liquidity);
    event LiquidityRemoved(address indexed provider, uint256 rbtcAmount, uint256 ryldAmount, uint256 liquidity);
    event Swap(address indexed user, bool rbtcToRyld, uint256 amountIn, uint256 amountOut);
    
    constructor(address _ryldToken) {
        ryldToken = IERC20(_ryldToken);
    }
    
    /**
     * @dev Get pool reserves
     */
    function getReserves() public view returns (uint256 rbtcReserve, uint256 ryldReserve) {
        return (address(this).balance, ryldToken.balanceOf(address(this)));
    }
    
    /**
     * @dev Add liquidity to the pool
     */
    function addLiquidity(uint256 ryldAmount) external payable nonReentrant returns (uint256) {
        require(msg.value > 0 && ryldAmount > 0, "Invalid amounts");
        
        (uint256 rbtcReserve, uint256 ryldReserve) = getReserves();
        uint256 liquidityMinted;
        
        // Transfer RYLD from user
        require(ryldToken.transferFrom(msg.sender, address(this), ryldAmount), "RYLD transfer failed");
        
        if (totalLiquidity == 0) {
            // First liquidity provider
            liquidityMinted = sqrt(msg.value.mul(ryldAmount)).sub(MINIMUM_LIQUIDITY);
            totalLiquidity = totalLiquidity.add(MINIMUM_LIQUIDITY);
        } else {
            // Calculate proportional liquidity
            uint256 rbtcLiquidity = msg.value.mul(totalLiquidity).div(rbtcReserve.sub(msg.value));
            uint256 ryldLiquidity = ryldAmount.mul(totalLiquidity).div(ryldReserve.sub(ryldAmount));
            liquidityMinted = rbtcLiquidity < ryldLiquidity ? rbtcLiquidity : ryldLiquidity;
        }
        
        require(liquidityMinted > 0, "Insufficient liquidity minted");
        
        liquidity[msg.sender] = liquidity[msg.sender].add(liquidityMinted);
        totalLiquidity = totalLiquidity.add(liquidityMinted);
        
        emit LiquidityAdded(msg.sender, msg.value, ryldAmount, liquidityMinted);
        
        return liquidityMinted;
    }
    
    /**
     * @dev Remove liquidity from the pool
     */
    function removeLiquidity(uint256 amount) external nonReentrant returns (uint256, uint256) {
        require(amount > 0 && amount <= liquidity[msg.sender], "Invalid amount");
        
        (uint256 rbtcReserve, uint256 ryldReserve) = getReserves();
        
        uint256 rbtcAmount = amount.mul(rbtcReserve).div(totalLiquidity);
        uint256 ryldAmount = amount.mul(ryldReserve).div(totalLiquidity);
        
        require(rbtcAmount > 0 && ryldAmount > 0, "Insufficient liquidity burned");
        
        liquidity[msg.sender] = liquidity[msg.sender].sub(amount);
        totalLiquidity = totalLiquidity.sub(amount);
        
        // Transfer tokens back to user
        require(ryldToken.transfer(msg.sender, ryldAmount), "RYLD transfer failed");
        (bool success, ) = msg.sender.call{value: rbtcAmount}("");
        require(success, "RBTC transfer failed");
        
        emit LiquidityRemoved(msg.sender, rbtcAmount, ryldAmount, amount);
        
        return (rbtcAmount, ryldAmount);
    }
    
    /**
     * @dev Swap RBTC for RYLD
     */
    function swapRBTCForRYLD() external payable nonReentrant returns (uint256) {
        require(msg.value > 0, "Invalid RBTC amount");
        
        (uint256 rbtcReserve, uint256 ryldReserve) = getReserves();
        uint256 amountOut = getAmountOut(msg.value, rbtcReserve.sub(msg.value), ryldReserve);
        
        require(amountOut > 0, "Insufficient output amount");
        require(ryldToken.transfer(msg.sender, amountOut), "RYLD transfer failed");
        
        emit Swap(msg.sender, true, msg.value, amountOut);
        
        return amountOut;
    }
    
    /**
     * @dev Swap RYLD for RBTC
     */
    function swapRYLDForRBTC(uint256 ryldAmount) external nonReentrant returns (uint256) {
        require(ryldAmount > 0, "Invalid RYLD amount");
        
        (uint256 rbtcReserve, uint256 ryldReserve) = getReserves();
        
        // Transfer RYLD from user
        require(ryldToken.transferFrom(msg.sender, address(this), ryldAmount), "RYLD transfer failed");
        
        uint256 amountOut = getAmountOut(ryldAmount, ryldReserve.sub(ryldAmount), rbtcReserve);
        
        require(amountOut > 0, "Insufficient output amount");
        
        (bool success, ) = msg.sender.call{value: amountOut}("");
        require(success, "RBTC transfer failed");
        
        emit Swap(msg.sender, false, ryldAmount, amountOut);
        
        return amountOut;
    }
    
    /**
     * @dev Calculate output amount for a swap
     */
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) 
        public 
        pure 
        returns (uint256) 
    {
        require(amountIn > 0, "Insufficient input amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        uint256 amountInWithFee = amountIn.mul(FEE_DENOMINATOR.sub(FEE_PERCENT));
        uint256 numerator = amountInWithFee.mul(reserveOut);
        uint256 denominator = reserveIn.mul(FEE_DENOMINATOR).add(amountInWithFee);
        
        return numerator.div(denominator);
    }
    
    /**
     * @dev Get expected output for RBTC to RYLD swap
     */
    function getRBTCToRYLDPrice(uint256 rbtcAmount) external view returns (uint256) {
        (uint256 rbtcReserve, uint256 ryldReserve) = getReserves();
        return getAmountOut(rbtcAmount, rbtcReserve, ryldReserve);
    }
    
    /**
     * @dev Get expected output for RYLD to RBTC swap
     */
    function getRYLDToRBTCPrice(uint256 ryldAmount) external view returns (uint256) {
        (uint256 rbtcReserve, uint256 ryldReserve) = getReserves();
        return getAmountOut(ryldAmount, ryldReserve, rbtcReserve);
    }
    
    /**
     * @dev Calculate square root (Babylonian method)
     */
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
    
    receive() external payable {
        revert("Please use swap functions");
    }
}
