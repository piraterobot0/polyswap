# Liquidity Guide for Prediction Market Hook

## Current Status

The prediction market hook is deployed on Polygon mainnet but **does not have liquidity yet**.

- **Hook Address**: `0x349810b251D655169fAd188CAC0F70c534130327`
- **Status**: Deployed and functional, awaiting initial liquidity
- **Required**: YES and NO tokens + MATIC for gas

## How to Add Liquidity

### Prerequisites

1. **MATIC** for gas fees on Polygon
2. **YES Tokens** (wPOSI-YES): `0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1`
3. **NO Tokens** (wPOSI-NO): `0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5`

### Option 1: Using JavaScript SDK

```bash
# 1. Set up environment
cd scripts
cp ../.env.example ../.env
# Edit .env with your private key

# 2. Run the liquidity script
node add-liquidity.js
```

### Option 2: Using Forge Scripts

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export POLYGON_RPC=https://polygon-rpc.com
export HOOK_ADDRESS=0x349810b251D655169fAd188CAC0F70c534130327

# Run the script
forge script script/AddLiquidity_1Each.s.sol \
  --rpc-url $POLYGON_RPC \
  --broadcast
```

### Option 3: Direct Contract Interaction

If you have tokens, you can interact directly with the hook:

1. Approve the hook to spend your YES and NO tokens
2. Call `addInitialLiquidity(poolKey, totalAmount)` on the hook

## Getting Tokens

### Option 1: Wrap Polymarket Positions

If you have Polymarket ERC-1155 positions:

1. Use the Wrapped1155Factory at `0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1`
2. Wrap your positions to get ERC-20 tokens

### Option 2: Buy from Existing Holders

Check token holders on Polygonscan and potentially trade OTC.

### Option 3: Test Environment

For testing, deploy on a testnet first where you can mint test tokens.

## Liquidity Mechanics

Our hook implements a **constant-sum AMM** with initial 80/20 price ratio:

```
Initial State (with 2 tokens total):
- YES Reserve: 1.6 tokens (80% price)
- NO Reserve: 0.4 tokens (20% price)
- Total: 2 tokens (constant sum)
```

### How Swaps Work

Example: Swap 0.1 YES for NO
```
Before: YES=1.6, NO=0.4 (sum=2.0)
Input: +0.1 YES
After: YES=1.7, NO=0.3 (sum=2.0)
Output: 0.1 NO (0.4-0.3)
New Prices: YES=85%, NO=15%
```

## Current Blockers

As of now, liquidity cannot be added because:

1. **No tokens in test wallet**: The provided wallet has 0 YES and 0 NO tokens
2. **No MATIC for gas**: The wallet has 0 MATIC
3. **Original deployer**: `0x884f5c47fa1ecaf0c8957611f648fb320551ab51` (not accessible)

## Solutions

To add liquidity, you need to:

1. **Fund a wallet** with MATIC for gas
2. **Acquire tokens** through wrapping or trading
3. **Run the liquidity script** with proper credentials

## Monitoring Pool State

Check the current pool state:

```bash
cd scripts
node pool-reader.js
```

This will show:
- Current reserves (currently 0)
- Token balances in hook
- Total supplies

## Security Notes

- Never share your private key
- Test on a small amount first
- Verify all addresses before transacting
- The hook is unaudited - use at your own risk

## Next Steps

Once liquidity is added:
1. Test swaps between YES and NO tokens
2. Monitor price movements
3. Add more liquidity as needed
4. Build UI for easier interaction

## Support

For issues or questions:
- Check the deployment logs in `/broadcast`
- Review the SDK examples in `/scripts`
- Verify contract on Polygonscan for transparency