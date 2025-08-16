# PolySwap - Prediction Market Trading Platform

A Uniswap V4 hook-based AMM and swapping interface for prediction market positions, with integrated ERC-1155 to ERC-20 wrapping for enhanced liquidity and DeFi compatibility.

## 🚀 Deployed Contracts

### Polygon Mainnet
- **Wrapped1155Factory**: [`0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1`](https://polygonscan.com/address/0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1#code) ✅ Verified
- **ERC20 Implementation**: [`0xf67438Cb870c911319cd4da95d064A6B4772081C`](https://polygonscan.com/address/0xf67438Cb870c911319cd4da95d064A6B4772081C)
- **Deployment TX**: [`0xd4d7688...`](https://polygonscan.com/tx/0xd4d7688960b047fa215414412f50eddff708ca3a55071ffb958c1d6ef93c8123)

### Wrapped Prediction Market Tokens
**"Will Google have the best AI model by September 2025?"**
- **YES Token (wPOSI-YES)**: [`0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1`](https://polygonscan.com/address/0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1)
  - Symbol: wPOSI-YES
  - Decimals: 18
  - Original ERC-1155 ID: 65880048952541620153230365826580171049439578129923156747663728476967119230732
- **NO Token (wPOSI-NO)**: [`0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5`](https://polygonscan.com/address/0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5)
  - Symbol: wPOSI-NO
  - Decimals: 18
  - Original ERC-1155 ID: 106277356443369138797049499065953438334187241175412976556484145976288075138631

## 📋 Overview

PolySwap is a complete prediction market trading solution that:

### Core Features
1. **Uniswap V4 Hook AMM** - Custom constant-sum market maker for prediction markets
2. **Position Trading Interface** - Swap between YES/NO positions with real-time pricing
3. **Portfolio Tracking** - View and manage prediction market positions
4. **ERC-1155 to ERC-20 Bridge** - Wrap Polymarket positions for DeFi compatibility

### Why PolySwap?
- **Enhanced Liquidity** - Create liquid markets for prediction outcomes
- **DeFi Integration** - Use wrapped positions in lending, yield farming, etc.
- **Efficient Trading** - Swap directly between YES/NO positions
- **Professional Interface** - Track positions, P&L, and market probabilities

## 🔧 Architecture

### 1. Prediction Market Trading (Uniswap V4 Hook)
- **Constant Sum AMM** - Ensures YES + NO = 1 for proper probability pricing
- **Hook-based Architecture** - Leverages V4's customizable liquidity pools
- **Automatic Rebalancing** - Maintains market efficiency

### 2. Token Wrapping System
- **ERC-1155 → ERC-20** - Converts Polymarket positions to fungible tokens
- **Deterministic Addresses** - Same wrapper for same market across all users
- **Reversible Process** - Unwrap back to original positions anytime

### 3. Web Interface
- **Portfolio Dashboard** - Track YES/NO positions and probabilities
- **Swap Interface** - Trade between outcomes with live pricing
- **Wallet Integration** - Seamless connection via RainbowKit

## 🛠 Technical Stack

### Smart Contracts
- **Uniswap V4 Hooks** - Custom AMM logic for prediction markets
- **Solidity 0.8.26** - V4 hook contracts
- **Solidity 0.6.12** - ERC-1155 wrapper factory
- **CREATE2 Deployment** - Deterministic contract addresses
- **OpenZeppelin** - Battle-tested token standards

### Frontend
- **React + Vite** - Fast, modern build tooling
- **RainbowKit** - Web3 wallet connection
- **Wagmi + Viem** - Ethereum interactions
- **TailwindCSS** - Responsive dark-theme UI

## 📁 Project Structure

```
polyswap/
├── gui/                         # Web interface
│   ├── src/
│   │   ├── components/
│   │   │   ├── PredictionMarket.jsx  # Position tracker
│   │   │   └── SwapV2.jsx           # Trading interface
│   │   └── config/
│   └── vercel.json             # Deployment config
├── prediction-market-hook/      # Uniswap V4 AMM
│   └── v4-constant-sum-main/
│       ├── src/                # Hook contracts
│       └── test/               # Hook tests
├── 1155_converter/             # Token wrapper
│   └── contracts/              # Factory contracts
├── transfer/                   # Gnosis Safe tools
└── scripts/                    # Wrapping utilities
```

## 🚀 Quick Start

### Use the Live App
Visit the deployed application to trade prediction market positions:
```
https://polyswap.vercel.app
```

### Run Locally
```bash
# Clone the repository
git clone https://github.com/piraterobot0/polyswap.git
cd polyswap

# Install and run the GUI
cd gui
npm install
npm run dev
```

### Environment Setup (for scripts)
```bash
# Create .env file for wrapping/transfer scripts
PRIVATE_KEY="your_private_key"
POLYGONSCAN_API_KEY="your_api_key"
```

## 💱 Trading Prediction Markets

### Current Market
**"Will Google have the best AI model by September 2025?"**
- Trade YES tokens if you believe Google will lead
- Trade NO tokens if you believe others will lead
- Market resolves September 30, 2025

### How to Trade
1. **Connect Wallet** - Use MetaMask or any Web3 wallet
2. **View Positions** - See your YES/NO token balances
3. **Swap Tokens** - Trade between outcomes at market prices
4. **Track Performance** - Monitor position values and probabilities

### Wrapping Polymarket Positions
```javascript
// Use the wrapper factory to convert ERC-1155 to ERC-20
node scripts/wrap-tokens.js

// Token addresses for this market:
YES: 0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1
NO:  0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5
```

## 🏗️ Uniswap V4 Hook Development

### Hook Architecture
The prediction market hook implements a constant-sum AMM where:
- YES + NO prices always equal 1
- Provides guaranteed liquidity at all price points
- No impermanent loss for LPs in binary markets

### Deploy Your Own Market
```solidity
// Deploy a new prediction market hook
PredictionMarketHook hook = new PredictionMarketHook(
    poolManager,
    "Will BTC hit $100k in 2025?"
);

// Initialize the pool with equal liquidity
hook.initializePool(token0, token1, initialLiquidity);
```

### Hook Features
- **Constant Sum Pricing** - Maintains probability constraint
- **Auto-rebalancing** - Adjusts liquidity distribution
- **Fee Collection** - Configurable LP fees
- **Resolution Logic** - Built-in market settlement

## 🧪 Development & Testing

### Run Tests
```bash
# Test V4 hooks
cd prediction-market-hook/v4-constant-sum-main
forge test

# Test wrapper contracts
cd 1155_converter/1155-to-20-master
npm test
```

### Local Development
```bash
# Start local Anvil fork
anvil --fork-url https://polygon-rpc.com

# Deploy hook locally
forge script script/DeployPredictionMarket.s.sol --rpc-url localhost
```

## 🤝 Contributing

We welcome contributions! Areas of interest:
- Additional V4 hook strategies (CPMM, dynamic fees)
- Multi-outcome markets (not just binary)
- Advanced trading features (limit orders, stop loss)
- Integration with other prediction platforms

## 📄 License

LGPL-3.0-or-later

## 🔗 Resources

- [Uniswap V4 Documentation](https://docs.uniswap.org/contracts/v4/overview)
- [Polymarket](https://polymarket.com)
- [EIP-1155 Standard](https://eips.ethereum.org/EIPS/eip-1155)
- [Original Gnosis Wrapper](https://github.com/gnosis/1155-to-20)
