# 🎨 Remix IDE Integration Guide

A comprehensive guide for using Remix IDE with your sc_utils contracts.

## What is Remix?

Remix is a powerful browser-based IDE for developing, deploying, and testing smart contracts. It requires no installation and provides:
- Solidity compiler
- Debugger
- Static analysis
- Deploy & interaction tools
- Plugin ecosystem

## Compiler Information

For all contracts in this project:
- **Compiler Version**: 0.8.19
- **EVM Version**: Paris
- **Optimization**: Enabled
- **Optimization Runs**: 200

## Quick Start

### 1. Export Contract to Remix

```bash
# Export any contract with instructions
python scripts/remix/export_to_remix.py contracts/generated/ESBMToken_basic_20250804_224641.sol

# Include deployment info for interaction
python scripts/remix/export_to_remix.py \
  contracts/generated/ESBMToken_basic_20250804_224641.sol \
  --deployment contracts/deployments/polygon_ESBM_deployment.json \
  --open-browser
```

### 2. Flatten Contract for Verification

```bash
# Flatten contract (removes imports, creates single file)
python scripts/compile/flatten_contract.py contracts/generated/ESBMToken_basic_20250804_224641.sol

# Output: contracts/generated/ESBMToken_basic_20250804_224641_flattened.sol
```

## Step-by-Step Remix Workflow

### Deploy New Contract

1. **Open Remix**: https://remix.ethereum.org

2. **Create Contract File**:
   - Click the "contracts" folder
   - Click "+" to create new file
   - Name it (e.g., `MyToken.sol`)

3. **Paste Contract Code**:
   - Copy your contract code
   - Paste into Remix editor

4. **Compile**:
   - Go to "Solidity Compiler" tab (3rd icon)
   - Select compiler: 0.8.19
   - Enable optimization ✓
   - Set runs to 200
   - Click "Compile"

5. **Deploy**:
   - Go to "Deploy & Run" tab (4th icon)
   - Environment: "Injected Provider - MetaMask"
   - Select contract from dropdown
   - Set constructor parameters
   - Click "Deploy"

### Interact with Existing Contract

1. **Get Contract Info**:
   ```bash
   # Your ESBM token
   Contract: 0xBa519dB67d7E1F74Db250264377B2ccD182fA162
   Network: Polygon
   ```

2. **Load in Remix**:
   - Go to "Deploy & Run" tab
   - At bottom, find "At Address" section
   - Paste: `0xBa519dB67d7E1F74Db250264377B2ccD182fA162`
   - Select "BasicERC20" from dropdown
   - Click "At Address"

3. **Interact**:
   - Expand the contract instance
   - Read functions (blue buttons): free to call
   - Write functions (orange/red): require gas

## Verify Contract on PolygonScan

### Method 1: Via Remix Plugin

1. **Install Plugin**:
   - Click "Plugin Manager" (bottom left)
   - Search "Etherscan"
   - Click "Activate"

2. **Configure**:
   - Go to Etherscan plugin
   - Select Network: Polygon
   - Enter API key (get from PolygonScan)

3. **Verify**:
   - Enter contract address
   - Select contract file
   - Click "Verify"

### Method 2: Manual Verification

1. **Prepare Flattened Contract**:
   ```bash
   python scripts/compile/flatten_contract.py \
     contracts/generated/ESBMToken_basic_20250804_224641.sol
   ```

2. **Go to PolygonScan**:
   - Visit: https://polygonscan.com/address/0xBa519dB67d7E1F74Db250264377B2ccD182fA162
   - Click "Contract" tab
   - Click "Verify and Publish"

3. **Fill Verification Form**:
   - Contract Address: (auto-filled)
   - Compiler Type: Solidity (Single file)
   - Compiler Version: v0.8.19+commit.7dd6d404
   - License: MIT

4. **Optimization**:
   - Optimization: Yes
   - Runs: 200

5. **Enter Code**:
   - Paste flattened contract
   - Constructor args (if needed)
   - Click "Verify"

## Common Remix Features

### Testing in Remix

1. **JavaScript VM**:
   - Deploy without real blockchain
   - Instant transactions
   - Perfect for testing

2. **Unit Tests**:
   - Create test files in "tests" folder
   - Use Solidity test framework
   - Run via "Solidity Unit Testing" plugin

### Debugging

1. **Debug Transaction**:
   - After any transaction
   - Click "Debug" in console
   - Step through execution

2. **Static Analysis**:
   - Plugin: "Solidity Static Analysis"
   - Finds common issues
   - Security warnings

### Gas Profiling

1. **Gas Estimates**:
   - Shows for each function
   - Before deployment

2. **Transaction Cost**:
   - Shown in console
   - After each transaction

## Tips & Tricks

### Keyboard Shortcuts
- `Ctrl/Cmd + S`: Save/Compile
- `Ctrl/Cmd + Shift + F`: Format code
- `Ctrl/Cmd + /`: Toggle comment

### Useful Plugins
- **Solidity Prettifier**: Auto-format code
- **Gas Profiler**: Detailed gas analysis
- **Mythx**: Security analysis
- **OneClickDapp**: Generate UI

### Import from GitHub
```solidity
// In Remix, you can import directly from GitHub
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.0/contracts/token/ERC20/ERC20.sol";
```

### Connect Hardware Wallet
1. Environment: "Injected Provider"
2. Connect MetaMask
3. Connect hardware wallet to MetaMask
4. Deploy/interact as normal

## Export ESBM Token Example

Let's export your deployed ESBM token:

```bash
# Export with deployment info
python scripts/remix/export_to_remix.py \
  contracts/generated/ESBMToken_basic_20250804_224641.sol \
  --deployment contracts/deployments/polygon_ESBM_deployment.json \
  --save-instructions esbm_remix_instructions.txt
```

This creates:
1. Instructions file
2. HTML helper with copy button
3. All info needed for Remix

## Troubleshooting

### "Contract not verified"
- Use flattened version
- Check compiler settings match exactly
- Ensure optimization settings correct

### "Out of gas"
- Increase gas limit
- Check function complexity
- Use gas profiler

### "Invalid constructor args"
- Check parameter types
- Use proper formatting
- Arrays need brackets: [1,2,3]

### Can't connect wallet
- Check network in MetaMask
- Refresh Remix
- Try different browser

## Next Steps

1. **Practice Deployment**:
   - Use Remix with test networks
   - Try different contract types

2. **Learn Debugging**:
   - Deploy buggy contract
   - Use debugger to find issues

3. **Explore Plugins**:
   - Try security analyzers
   - Use gas profilers

4. **Build DApps**:
   - OneClickDapp plugin
   - Generate simple UIs

---

Remix is perfect for learning and prototyping. Use it alongside sc_utils for a complete development workflow!