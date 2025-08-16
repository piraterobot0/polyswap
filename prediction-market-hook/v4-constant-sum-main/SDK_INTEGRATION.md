# Uniswap V4 SDK Integration

This guide demonstrates how to use the Uniswap V4 SDK with our prediction market hook.

## Installation

The Uniswap V4 SDK has been installed:
```bash
npm i --save @uniswap/v4-sdk
npm i --save @uniswap/sdk-core
```

## Available Scripts

### 1. Pool State Reader
Reads the current state of the prediction market pool:
```bash
cd scripts
node pool-reader.js
```

This script shows:
- Token information
- Pool reserves
- Current prices (YES/NO probabilities)
- Token balances in the hook
- Total token supplies

### 2. SDK Interaction Demo
Demonstrates SDK usage patterns:
```bash
cd scripts
node sdk-interaction.js
```

This script demonstrates:
- Creating Token instances
- Building PoolKey objects
- Calculating swap outputs
- Understanding the constant-sum AMM

### 3. Swap Execution
Execute actual swaps (requires private key):
```bash
cd scripts
# Set PRIVATE_KEY in your .env first
node execute-swap.js
```

## Key Concepts

### Pool Key Structure
```javascript
const poolKey = {
  currency0: token0Address,  // Lower address
  currency1: token1Address,  // Higher address
  fee: 3000,                 // 0.3%
  tickSpacing: 60,
  hooks: hookAddress
};
```

### Constant-Sum AMM
Our hook implements X + Y = K instead of X * Y = K:
- Maintains constant sum of reserves
- Prices always sum to 100%
- No impermanent loss in binary markets
- Linear price curve

### Current Deployment
- **Hook**: `0x349810b251D655169fAd188CAC0F70c534130327`
- **YES Token**: `0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1`
- **NO Token**: `0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5`
- **Network**: Polygon Mainnet

## SDK Usage Examples

### Reading Pool State
```javascript
import { ethers } from 'ethers';

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const hook = new ethers.Contract(hookAddress, HOOK_ABI, provider);

// Get pool ID
const poolId = calculatePoolId(poolKey);

// Read liquidity
const totalLiquidity = await hook.totalLiquidity(poolId);
const yesReserve = await hook.yesReserve(poolId);
const noReserve = await hook.noReserve(poolId);
```

### Creating Token Instances
```javascript
import { Token } from '@uniswap/sdk-core';

const yesToken = new Token(
  137,  // Polygon chainId
  '0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1',
  18,
  'wPOSI-YES',
  'Wrapped YES Position'
);
```

### Preparing a Swap
```javascript
const swapParams = {
  zeroForOne: true,  // Direction
  amountSpecified: ethers.parseEther('0.1'),
  sqrtPriceLimitX96: 0  // No limit
};

const tx = await hook.swap(poolKey, swapParams, '0x');
```

## Troubleshooting

### No Liquidity Error
If you see "0.0 tokens" in reserves, the pool needs initial liquidity:
```bash
forge script script/AddLiquidity_1Each.s.sol --rpc-url $POLYGON_RPC --broadcast
```

### Connection Issues
Ensure your RPC endpoint is working:
```bash
export POLYGON_RPC=https://polygon-rpc.com
```

### Import Errors
The scripts use ES6 modules. Ensure package.json has:
```json
{
  "type": "module"
}
```

## Next Steps

1. **Add Liquidity**: Deploy liquidity to the pool
2. **Build UI**: Use these SDK patterns in a React app
3. **Add Features**: Implement slippage protection, price impact calculations
4. **Monitor Events**: Set up event listeners for swaps and liquidity changes

## Resources

- [Uniswap V4 Docs](https://docs.uniswap.org/contracts/v4/overview)
- [V4 SDK GitHub](https://github.com/Uniswap/v4-sdk)
- [SDK Core Docs](https://docs.uniswap.org/sdk/v3/overview)