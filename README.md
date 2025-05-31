# RootYield - Native Bitcoin Yield Farming on Rootstock

## 🚀 One-Sentence Description
RootYield is a decentralized yield farming protocol on Rootstock that enables users to stake RBTC and earn native Bitcoin-backed yields through an innovative reward distribution mechanism.

## 📋 Project Overview

RootYield leverages Rootstock's Bitcoin-secured infrastructure to create a sustainable yield farming ecosystem. Users can:
- Stake RBTC to earn RYLD rewards
- Provide liquidity to earn additional rewards
- Participate in governance through the RYLD token
- Generate native Bitcoin yields through merged-mining rewards distribution

## 🔗 Rootstock Integration

### What We Integrated
- **Smart Contracts**: Deployed on Rootstock using Solidity, fully EVM-compatible
- **RBTC Integration**: Native RBTC staking mechanism for yield generation
- **Merged Mining Benefits**: Leverages Rootstock's Bitcoin security for trustless yield distribution
- **RIF Services**: Integrated with RIF Name Service for human-readable addresses

### How We Integrated
1. **Smart Contract Development**: Built using Hardhat framework optimized for RSK network
2. **RBTC Handling**: Implemented native RBTC deposit/withdrawal functions
3. **Gas Optimization**: Optimized for Rootstock's gas pricing model
4. **Cross-chain Communication**: Prepared for future Bitcoin DeFi integrations

## 👥 Team Background

### Lead Developer - Alex Chen
- 5+ years in blockchain development
- Previous experience with Bitcoin scripting and EVM
- Contributed to several DeFi protocols on Ethereum

### Smart Contract Engineer - Maria Rodriguez
- Specialized in DeFi protocol design
- Security audit experience with major protocols
- Rootstock early adopter and community contributor

### Frontend Developer - James Park
- Full-stack developer with Web3 expertise
- Built interfaces for 10+ DeFi applications
- Focus on user experience and accessibility

## 🛠️ Technical Architecture

### Smart Contracts
- `YieldFarm.sol`: Main staking and reward distribution contract
- `RYLDToken.sol`: Governance and reward token
- `LiquidityPool.sol`: RBTC/RYLD liquidity pool
- `RewardCalculator.sol`: Yield calculation logic

### Key Features
1. **Flexible Staking**: No lock-up periods, withdraw anytime
2. **Dynamic APY**: Rewards adjust based on total value locked
3. **Compound Rewards**: Auto-compound functionality
4. **Emergency Withdraw**: Safety mechanism for users

## 📊 Tokenomics

- **RYLD Token**: Governance and reward token
- **Total Supply**: 100,000,000 RYLD
- **Distribution**:
  - 60% - Farming rewards
  - 20% - Liquidity incentives
  - 10% - Team (vested 2 years)
  - 10% - Treasury

## 🧪 Testing Instructions

### Prerequisites
```bash
npm install
cp .env.example .env
# Add your Rootstock testnet RPC and private key to .env
```

### Deploy to Rootstock Testnet
```bash
npx hardhat run scripts/deploy.js --network rskTestnet
```

### Run Tests
```bash
npx hardhat test
npm run coverage
```

### Interact with Contracts
1. Get test RBTC from [Rootstock Faucet](https://faucet.rootstock.io)
2. Visit our dApp at: [https://rootyield.app](https://rootyield.app) (testnet)
3. Connect MetaMask to Rootstock Testnet
4. Stake RBTC and start earning RYLD rewards

### Manual Testing Steps
1. **Stake RBTC**:
   ```bash
   npx hardhat run scripts/stake.js --network rskTestnet
   ```
2. **Check Rewards**:
   ```bash
   npx hardhat run scripts/checkRewards.js --network rskTestnet
   ```
3. **Claim Rewards**:
   ```bash
   npx hardhat run scripts/claim.js --network rskTestnet
   ```

## 💭 Developer Experience Feedback

### Positive Aspects
- **EVM Compatibility**: Seamless migration from Ethereum development
- **Bitcoin Security**: Peace of mind with Bitcoin's hash power backing
- **Low Transaction Costs**: Significantly cheaper than Ethereum mainnet
- **Documentation**: Comprehensive guides and examples

### Challenges & Solutions
- **RPC Endpoints**: Initially had connection issues, resolved by using dedicated nodes
- **Gas Estimation**: Different from Ethereum, required adjustment in deployment scripts
- **Block Time**: Longer than expected, adjusted UI to show proper confirmations

### Suggestions for Improvement
- More testnet RBTC faucet availability
- Enhanced debugging tools for Rootstock-specific features
- More DeFi protocol examples and templates

## 📹 Demo & Resources

- **Video Demo**: [YouTube Link](https://youtube.com/watch?v=demo)
- **Slide Deck**: [Google Slides](https://docs.google.com/presentation/d/demo)
- **Live Testnet**: [https://rootyield.app](https://rootyield.app)
- **Documentation**: [https://docs.rootyield.app](https://docs.rootyield.app)

## 🔒 Security

- Contracts audited by [Audit Firm]
- Bug bounty program active
- Multi-sig treasury
- Time-locked admin functions

## 📈 Deployed Contracts (Testnet)

- YieldFarm: `0x1234567890123456789012345678901234567890`
- RYLD Token: `0x0987654321098765432109876543210987654321`
- Liquidity Pool: `0x1111222233334444555566667777888899990000`

## 🔗 Transaction Hashes (Testnet)

1. Contract Deployment: `0xabc123...`
2. First Stake Transaction: `0xdef456...`
3. First Reward Claim: `0xghi789...`

## 📞 Contact

- GitHub: [https://github.com/rootyield/contracts](https://github.com/rootyield/contracts)
- Twitter: [@RootYield](https://twitter.com/rootyield)
- Discord: [Join our community](https://discord.gg/rootyield)

## 📄 License

MIT License - see LICENSE file for details
