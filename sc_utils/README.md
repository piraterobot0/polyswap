# ⚠️ HOT WALLET UTILITIES - LOW SECURITY ⚠️

## **CRITICAL WARNINGS**

🔴 **THIS IS A HOT WALLET IMPLEMENTATION**
- **MAXIMUM VALUE:** $20-30 USD only
- **SECURITY LEVEL:** Basic (not production-ready)
- **USE CASE:** Testing, learning, and small-value transactions only
- **NOT FOR:** Mainnet production, large values, or critical operations

## **Security Limitations**

This implementation stores private keys in `.env` file for convenience. This is **NOT SECURE** for production use. 

### Future Secure Implementation
A separate, secure implementation will be created with:
- Hardware wallet support (Ledger/Trezor)
- Encrypted keystores
- Multi-signature requirements
- Professional audit requirements

## **Built-in Safety Limits**

To prevent accidental loss, this hot wallet implementation includes:
- **Max transaction value:** 0.01 ETH (~$30)
- **Max gas price:** 100 gwei
- **Network restrictions:** Testnets preferred
- **Confirmation prompts:** For all mainnet transactions
- **Daily spending limit:** $30 total

## **Core Features**

### 🪙 ERC-20 Token Generator
- **5 Templates:** Basic, Mintable, Burnable, Pausable, Advanced
- Interactive CLI for token creation
- Automatic deployment scripts
- Full documentation and examples
- See [ERC20_GENERATOR.md](contracts/standards/ERC20_GENERATOR.md)

### 🎨 Remix IDE Integration
- Export contracts to Remix with one command
- Contract flattening for verification
- Interactive HTML helpers
- Step-by-step guides
- See [REMIX_GUIDE.md](docs/REMIX_GUIDE.md)

### 🔧 Web3 Manager
- Multi-account support (2 hot wallets)
- Automatic RPC failover (private → public)
- Transaction management
- Balance checking
- Network switching

### ⛽ Gas Manager
- Dynamic gas pricing (EIP-1559 and Legacy)
- Smart gas estimation with safety buffers
- Batch transaction optimization
- Nonce management for sequential transactions
- Multi-network configurations
- See [GAS_MANAGER.md](docs/GAS_MANAGER.md)

### 🛡️ Safety Limits
- Maximum transaction value: 0.01 ETH (~$30)
- Maximum gas price: 100 gwei
- Confirmation prompts for mainnet
- Daily spending limits

## **Quick Start**

### 1. Install Dependencies
```bash
cd sc_utils
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your TEST private keys (small value only!)
# Add PRIVATE_KEY1 and PRIVATE_KEY2
```

### 3. Generate & Deploy Your First Token
```bash
# Generate an ERC-20 token interactively
python scripts/generate/generate_erc20.py

# Deploy to testnet
python scripts/deploy/deploy_generated.py contracts/generated/YourToken_params.json --network sepolia

# Or deploy to mainnet (with confirmation)
python scripts/deploy/deploy_generated.py contracts/generated/YourToken_params.json --network polygon
```

## **Recent Deployments**

### ESBM Token (Everyone Sucks But Me)
- **Network:** Polygon Mainnet
- **Contract:** `0xBa519dB67d7E1F74Db250264377B2ccD182fA162`
- **Supply:** 1,000,000 ESBM
- **Type:** Basic ERC-20 (no mint/burn/pause)
- **View:** [PolygonScan](https://polygonscan.com/address/0xBa519dB67d7E1F74Db250264377B2ccD182fA162)

## **Common Commands**

### Token Operations
```bash
# Check token balance
python scripts/tokens/balance.py --token 0xBa519dB67d7E1F74Db250264377B2ccD182fA162 --network polygon

# Transfer tokens
python scripts/tokens/transfer.py --token 0xBa519dB67d7E1F74Db250264377B2ccD182fA162 --to 0x... --amount 100 --network polygon

# Send ETH/MATIC
python scripts/transfers/send_eth.py --to 0x... --amount 0.01 --network polygon
```

### Remix Integration
```bash
# Export contract to Remix
python scripts/remix/export_to_remix.py contracts/YourToken.sol --open-browser

# Flatten for verification
python scripts/compile/flatten_contract.py contracts/YourToken.sol
```

### Gas Management
```bash
# Check current gas prices
python scripts/gas/check_gas.py --network polygon

# Estimate transaction cost
python scripts/gas/estimate_cost.py --network polygon --gas-limit 100000
```

## **Directory Structure**

```
sc_utils/
├── .env                    # Private keys (HOT WALLET ONLY - $30 max)
├── config/                 # Network and RPC configurations
│   ├── networks.json       # Network settings
│   └── public_rpcs.json    # Public RPC endpoints
├── contracts/              # Smart contracts
│   ├── standards/          # Standard contract templates
│   │   └── erc20/         # ERC-20 templates (5 types)
│   ├── generated/         # Generated token contracts
│   ├── compiled/          # Compiled contracts
│   └── deployments/       # Deployment records
├── scripts/               # Utility scripts
│   ├── generate/          # Token generator
│   ├── deploy/            # Deployment scripts
│   ├── tokens/            # Token interactions
│   ├── transfers/         # ETH/token transfers
│   ├── remix/             # Remix IDE tools
│   └── compile/           # Compilation tools
├── utils/                 # Core utilities
│   ├── web3_manager.py    # Web3 connection manager
│   ├── gas_manager.py     # Gas optimization
│   └── safety_limits.py   # Transaction safety
├── docs/                  # Documentation
│   ├── GAS_MANAGER.md     # Gas manager guide
│   └── REMIX_GUIDE.md     # Remix integration guide
└── logs/                  # Transaction logs
```

## **Development Timeline**

### ✅ Completed Features
- Multi-account hot wallet system
- Automatic RPC failover (private + public)
- ERC-20 token generator (5 templates)
- Advanced gas management system
- Batch transaction capabilities
- Remix IDE integration tools
- Contract flattening for verification
- Safety limits and confirmations

### 🔄 Recent Session (2025-01-04)
- Generated and deployed ESBM token to Polygon mainnet
- Created Remix integration utilities
- Added contract flattening tool
- Comprehensive documentation updates

### 🚀 Future Enhancements
- Hardware wallet integration
- Multi-signature support
- Advanced DeFi interactions
- NFT contract templates
- Automated testing suite

## **RPC Configuration**

The system uses a dual RPC strategy for reliability:

1. **Private RPCs** (from `.env`): Your personal API keys from Alchemy/Infura
2. **Public RPCs** (from `config/public_rpcs.json`): Free public endpoints as fallback

The system automatically:
- Tries private RPCs first for better performance
- Falls back to public RPCs if private ones fail
- Tries multiple public RPCs until one works
- No configuration needed - works out of the box!

## **Safety Best Practices**

### ✅ DO
- Test on testnets first
- Keep less than $30 in wallets
- Review transactions before confirming
- Use generated contracts as learning tools
- Export to Remix for debugging

### ❌ DON'T
- Store more than $30 worth of assets
- Use this for production mainnet applications
- Share your .env file
- Ignore transaction confirmations
- Bypass safety limits

## **Getting Help**

For issues or questions, remember this is a learning/testing tool only. For production needs, wait for the future secure implementation.

### Useful Resources
- [ERC-20 Generator Guide](contracts/standards/ERC20_GENERATOR.md)
- [Gas Manager Documentation](docs/GAS_MANAGER.md)
- [Remix Integration Guide](docs/REMIX_GUIDE.md)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Web3.py Documentation](https://web3py.readthedocs.io/)

---

**Last Updated:** 2025-01-04
**Security Level:** HOT WALLET - TEST USE ONLY
**Maximum Safe Value:** $30 USD
**Latest Deployment:** ESBM Token on Polygon