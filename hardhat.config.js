require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const RSK_TESTNET_RPC = process.env.RSK_TESTNET_RPC || "https://public-node.testnet.rsk.co";
const RSK_MAINNET_RPC = process.env.RSK_MAINNET_RPC || "https://public-node.rsk.co";

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  
  networks: {
    hardhat: {
      forking: {
        url: RSK_TESTNET_RPC,
        enabled: false
      }
    },
    
    rskTestnet: {
      url: RSK_TESTNET_RPC,
      chainId: 31,
      gasPrice: 60000000, // 0.06 gwei
      accounts: [PRIVATE_KEY],
      timeout: 60000,
      // RSK specific settings
      gasMultiplier: 1.2,
    },
    
    rskMainnet: {
      url: RSK_MAINNET_RPC,
      chainId: 30,
      gasPrice: 60000000, // 0.06 gwei
      accounts: [PRIVATE_KEY],
      timeout: 60000,
      // RSK specific settings
      gasMultiplier: 1.2,
    }
  },
  
  etherscan: {
    apiKey: {
      rskTestnet: "YOUR_RSK_EXPLORER_API_KEY",
      rskMainnet: "YOUR_RSK_EXPLORER_API_KEY"
    },
    customChains: [
      {
        network: "rskTestnet",
        chainId: 31,
        urls: {
          apiURL: "https://rootstock-testnet.blockscout.com/api",
          browserURL: "https://rootstock-testnet.blockscout.com"
        }
      },
      {
        network: "rskMainnet",
        chainId: 30,
        urls: {
          apiURL: "https://rootstock.blockscout.com/api",
          browserURL: "https://rootstock.blockscout.com"
        }
      }
    ]
  },
  
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    token: "RBTC",
    gasPriceApi: "https://public-node.testnet.rsk.co",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },
  
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  
  mocha: {
    timeout: 60000
  }
};
