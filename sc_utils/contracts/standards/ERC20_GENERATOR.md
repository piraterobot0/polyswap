# 🪙 ERC-20 Token Generator

A comprehensive tool for generating and deploying customized ERC-20 tokens with various features.

## Available Templates

### 1. **Basic ERC-20** (`basic`)
- Fixed supply minted at deployment
- No owner functions
- Simplest implementation
- Use case: Basic utility tokens, fixed supply tokens

### 2. **Mintable ERC-20** (`mintable`)
- Owner can mint new tokens
- Variable supply
- Ownership transferable
- Use case: Reward tokens, governance tokens

### 3. **Burnable ERC-20** (`burnable`)
- Token holders can burn their tokens
- Reduces total supply (deflationary)
- Fixed initial supply
- Use case: Deflationary tokens, buy-back and burn models

### 4. **Pausable ERC-20** (`pausable`)
- Owner can pause all transfers
- Emergency stop mechanism
- Ownership functions
- Use case: Regulated tokens, security incidents

### 5. **Advanced ERC-20** (`advanced`)
- Combines all features
- Mintable + Burnable + Pausable
- Optional supply cap
- Most flexible option
- Use case: Complex tokenomics, DeFi tokens

## Usage

### Generate a Token

```bash
python scripts/generate/generate_erc20.py
```

You'll be prompted for:
- **Template**: Choose from basic, mintable, burnable, pausable, or advanced
- **Token Name**: Full name (e.g., "My Awesome Token")
- **Token Symbol**: Short symbol (e.g., "MAT")
- **Decimals**: Usually 18 (like ETH)
- **Initial Supply**: Tokens to mint at deployment

For advanced template, you can also set:
- **--cap**: Maximum supply cap (0 = unlimited)

### Example Commands

#### Basic Token
```bash
python scripts/generate/generate_erc20.py \
  --template basic \
  --name "Simple Token" \
  --symbol "SMPL" \
  --decimals 18 \
  --supply 1000000
```

#### Advanced Token with Cap
```bash
python scripts/generate/generate_erc20.py \
  --template advanced \
  --name "DeFi Token" \
  --symbol "DEFI" \
  --decimals 18 \
  --supply 1000000 \
  --cap 10000000
```

### Deploy Generated Token

After generation, deploy using:

```bash
python scripts/deploy/deploy_generated.py <params_file> --network sepolia
```

Example:
```bash
python scripts/deploy/deploy_generated.py \
  contracts/generated/DEFI_Token_advanced_20240104_120000_params.json \
  --network sepolia
```

## Generated Files

Each token generation creates:
1. **Contract file**: `contracts/generated/{SYMBOL}Token_{template}_{timestamp}.sol`
2. **Parameters file**: `contracts/generated/{SYMBOL}Token_{template}_{timestamp}_params.json`

## Feature Comparison

| Feature | Basic | Mintable | Burnable | Pausable | Advanced |
|---------|-------|----------|----------|----------|----------|
| Fixed Supply | ✅ | ❌ | ✅ | ✅ | Optional |
| Minting | ❌ | ✅ | ❌ | ❌ | ✅ |
| Burning | ❌ | ❌ | ✅ | ❌ | ✅ |
| Pausable | ❌ | ❌ | ❌ | ✅ | ✅ |
| Ownable | ❌ | ✅ | ❌ | ✅ | ✅ |
| Supply Cap | N/A | ❌ | N/A | N/A | ✅ |

## Contract Functions

### Common Functions (All Templates)
- `name()` - Token name
- `symbol()` - Token symbol
- `decimals()` - Token decimals
- `totalSupply()` - Current total supply
- `balanceOf(address)` - Get balance
- `transfer(address, uint256)` - Transfer tokens
- `approve(address, uint256)` - Approve spending
- `transferFrom(address, address, uint256)` - Transfer on behalf
- `allowance(address, address)` - Check allowance

### Template-Specific Functions

#### Mintable
- `mint(address, uint256)` - Mint new tokens (owner only)
- `transferOwnership(address)` - Transfer ownership
- `renounceOwnership()` - Renounce ownership

#### Burnable
- `burn(uint256)` - Burn your own tokens
- `burnFrom(address, uint256)` - Burn tokens with allowance

#### Pausable
- `pause()` - Pause all transfers (owner only)
- `unpause()` - Resume transfers (owner only)
- `paused()` - Check if paused

#### Advanced
- All functions from above templates
- Supply cap enforcement on minting

## Security Considerations

1. **Ownership**: Be careful with owner privileges
2. **Minting**: Can affect token value if misused
3. **Pausing**: Can freeze user funds temporarily
4. **Testing**: Always test on testnet first
5. **Auditing**: Get professional audit for production

## Example Workflow

### 1. Generate a DeFi Token
```bash
python scripts/generate/generate_erc20.py
# Select: advanced
# Name: My DeFi Token
# Symbol: MDT
# Decimals: 18
# Initial Supply: 1000000
# Cap: 5000000
```

### 2. Review Generated Contract
```bash
cat contracts/generated/MDTToken_advanced_*.sol
```

### 3. Deploy to Testnet
```bash
python scripts/deploy/deploy_generated.py \
  contracts/generated/MDTToken_advanced_*_params.json \
  --network sepolia
```

### 4. Interact with Token
```bash
# Check balance
python scripts/tokens/balance.py \
  --network sepolia \
  --tokens 0xYOUR_TOKEN_ADDRESS

# Transfer tokens
python scripts/tokens/transfer.py \
  --network sepolia \
  --token 0xYOUR_TOKEN_ADDRESS \
  --to 0xRECIPIENT \
  --amount 100

# Mint more (if mintable)
python scripts/interact/call_function.py \
  --network sepolia \
  --contract 0xYOUR_TOKEN_ADDRESS \
  --function mint \
  --args 0xRECIPIENT 1000000000000000000000
```

## Tips

1. **Choose the Right Template**: 
   - Use `basic` for simple fixed-supply tokens
   - Use `mintable` for reward/governance tokens
   - Use `burnable` for deflationary models
   - Use `pausable` for regulated tokens
   - Use `advanced` when you need flexibility

2. **Supply Considerations**:
   - Remember decimals when setting supply
   - 1,000,000 supply with 18 decimals = 1,000,000 * 10^18 smallest units
   - Consider max supply cap for advanced tokens

3. **Gas Optimization**:
   - Basic template uses least gas
   - Advanced template uses most gas
   - More features = higher deployment cost

4. **Testing Checklist**:
   - ✓ Deploy on testnet
   - ✓ Transfer tokens
   - ✓ Test all features
   - ✓ Check gas costs
   - ✓ Verify on explorer

---

The ERC-20 Generator makes it easy to create professional tokens with the features you need!