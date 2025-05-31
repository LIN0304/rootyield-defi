// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title RYLDToken
 * @dev Governance and reward token for RootYield protocol
 */
contract RYLDToken is ERC20, ERC20Burnable, AccessControl, ERC20Permit {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 public constant MAX_SUPPLY = 100_000_000 * 1e18; // 100 million RYLD
    uint256 public constant INITIAL_SUPPLY = 40_000_000 * 1e18; // 40 million initial
    
    mapping(address => bool) public isExcludedFromFees;
    
    event MinterAdded(address indexed account);
    event MinterRemoved(address indexed account);
    event ExcludedFromFees(address indexed account, bool excluded);
    
    constructor() 
        ERC20("RootYield Token", "RYLD") 
        ERC20Permit("RootYield Token") 
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        
        // Mint initial supply to deployer for distribution
        _mint(msg.sender, INITIAL_SUPPLY);
        
        // Exclude protocol contracts from fees
        isExcludedFromFees[msg.sender] = true;
    }
    
    /**
     * @dev Mint new tokens (only MINTER_ROLE)
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
    }
    
    /**
     * @dev Add minter role
     */
    function addMinter(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, account);
        emit MinterAdded(account);
    }
    
    /**
     * @dev Remove minter role
     */
    function removeMinter(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(MINTER_ROLE, account);
        emit MinterRemoved(account);
    }
    
    /**
     * @dev Set fee exclusion status
     */
    function setExcludedFromFees(address account, bool excluded) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        isExcludedFromFees[account] = excluded;
        emit ExcludedFromFees(account, excluded);
    }
    
    /**
     * @dev Override decimals to 18
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
    
    /**
     * @dev Get circulating supply (total - burned)
     */
    function circulatingSupply() external view returns (uint256) {
        return totalSupply();
    }
    
    /**
     * @dev Check if an address has minter role
     */
    function isMinter(address account) external view returns (bool) {
        return hasRole(MINTER_ROLE, account);
    }
}
