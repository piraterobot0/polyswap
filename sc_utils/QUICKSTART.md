# 🚀 Quick Start Guide

## ⚠️ IMPORTANT: HOT WALLET WARNING
This is a **HOT WALLET** implementation with **$30 maximum value**. Use testnets for development!

## Setup

### 1. Install Python Dependencies
```bash
cd sc_utils
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required in `.env`:
- `PRIVATE_KEY1`: Your first hot wallet private key (TEST USE ONLY)
- `PRIVATE_KEY2`: Your second hot wallet private key (TEST USE ONLY)
- `SEPOLIA_RPC`: Get from https://alchemy.com or https://infura.io (free tier)

### 3. Get Test ETH
For Sepolia testnet:
- https://sepoliafaucet.com
- https://sepolia-faucet.pk910.de

## Basic Usage Examples

### Check Balance
```bash
# Check balance for account 1 (default)
python scripts/tokens/balance.py --network sepolia

# Check balance for account 2
python scripts/tokens/balance.py --network sepolia --account 2

# Check all accounts
python scripts/tokens/balance.py --address all
```

### Deploy ERC20 Token
```bash
# Deploy with account 1 (default)
python scripts/deploy/deploy_token.py --network sepolia

# Deploy with account 2
python scripts/deploy/deploy_token.py --network sepolia --account 2
# You'll be prompted for token details
```

### Transfer Tokens
```bash
python scripts/tokens/transfer.py \
  --network sepolia \
  --token 0xYOUR_TOKEN_ADDRESS \
  --to 0xRECIPIENT_ADDRESS \
  --amount 100
```

### Call Any Contract Function
```bash
# Read function (view)
python scripts/interact/call_function.py \
  --network sepolia \
  --contract 0xCONTRACT_ADDRESS \
  --function balanceOf \
  --args 0xADDRESS

# Write function (transaction)
python scripts/interact/call_function.py \
  --network sepolia \
  --contract 0xCONTRACT_ADDRESS \
  --function transfer \
  --args 0xRECIPIENT 1000000000000000000
```

## Smart Contract Deployment

### 1. Write Your Contract
Place your Solidity file in `templates/` or `contracts/source/`

### 2. Compile
```bash
python scripts/compile/compile_sol.py templates/YourContract.sol
```

### 3. Deploy
Create a deployment script or use the generic deployer:
```python
from utils import Web3Manager
from scripts.compile.compile_sol import compile_contract

# Initialize
w3 = Web3Manager('sepolia')

# Compile
compiled = compile_contract('templates/YourContract.sol')

# Deploy
address, tx_hash = w3.deploy_contract(
    bytecode=compiled['bytecode'],
    abi=compiled['abi'],
    constructor_args=[arg1, arg2]  # if needed
)
```

## Network Support

### Testnets (Recommended)
- `sepolia` - Ethereum Sepolia
- `goerli` - Ethereum Goerli  
- `mumbai` - Polygon Mumbai
- `bsc_testnet` - BSC Testnet

### Mainnets (⚠️ Use with caution)
- `ethereum` - Ethereum Mainnet
- `polygon` - Polygon Mainnet
- `arbitrum` - Arbitrum One
- `bsc` - BNB Smart Chain

## Safety Features

✅ **Built-in Protections:**
- Max transaction value: 0.01 ETH (~$30)
- Max gas price: 100 gwei
- Daily spending limit: $30
- Mainnet confirmation prompts
- Transaction simulation

❌ **Never:**
- Store more than $30 in value
- Share your `.env` file
- Use for production applications
- Ignore safety warnings

## Common Issues

### "Missing RPC URL"
Add RPC endpoints to `.env`:
```
SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

### "Insufficient balance"
Get test ETH from faucets listed above

### "Gas price too high"
The hot wallet limits gas to 100 gwei. Wait for lower gas prices or use testnet.

## Python Usage

```python
from utils import Web3Manager

# Initialize with account 1 (default)
w3 = Web3Manager('sepolia')

# Initialize with account 2
w3 = Web3Manager('sepolia', account_number=2)

# Switch between accounts
w3.switch_account(2)  # Switch to account 2
w3.switch_account(1)  # Switch back to account 1

# Check all account balances
w3.get_all_balances()

# Check balance
balance = w3.get_balance()
print(f"Balance: {balance} ETH")

# Send transaction
tx_hash = w3.send_transaction(
    to='0x...',
    value_eth=0.001
)

# Deploy contract
address, tx = w3.deploy_contract(
    bytecode='0x...',
    abi=[...]
)

# Call contract
result = w3.call_function(
    contract_address='0x...',
    abi=[...],
    function_name='balanceOf',
    args=['0x...']
)
```

### Test Your Accounts

```bash
# Test that both accounts are working
python test_accounts.py
```

## Next Steps

1. **Test on Sepolia** - Always test on testnet first
2. **Small Values Only** - Remember the $30 limit
3. **Future Security** - Plan migration to secure implementation for production

## Support

This is a learning/testing tool. For production needs:
- Use hardware wallets
- Implement proper key management
- Get professional security audits

---

**Remember:** This is a HOT WALLET with basic security. Maximum value: $30!