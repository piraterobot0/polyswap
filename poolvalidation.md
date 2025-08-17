# Uniswap V4 Pool Validation Issue

## Objective
Initialize a Uniswap V4 pool on Polygon mainnet with a custom hook and add liquidity with 80% YES token probability for a prediction market.

## Current Setup

### Deployed Contracts
- **Pool Manager**: `0x67366782805870060151383F4BbFF9daB53e5cD6` (Uniswap V4 official on Polygon)
- **Hook Contract**: `0x11109438ba3e2520A29972BE91ec9bA7d06D2339` (FlexiblePredictionHook)
- **LiquidityHelper**: `0x04B2f36a19d15382a14D718c4D640Bdd2a2DD873`
- **YES Token**: `0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1`
- **NO Token**: `0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5`

### Hook Implementation
The FlexiblePredictionHook implements a constant sum AMM (X+Y=K) with the following permissions:
- `beforeAddLiquidity: true`
- `beforeSwap: true`
- `beforeSwapReturnDelta: true`

### Hook Address Validation
- Required permissions bitmap: `0x0444` (bits 2, 6, 10 set)
- Required address prefix: `0x1110` (permissions << 2)
- Actual hook address: `0x11109438ba3e2520A29972BE91ec9bA7d06D2339`
- Address prefix (upper 16 bits): `0x1110` ✓ MATCHES

## The Problem

Despite having the correct address prefix that matches the required permissions, we consistently receive two errors:

### Error 1: HookAddressNotValid
When attempting to initialize the pool through `poolManager.initialize()`:
```
[Revert] HookAddressNotValid(0x11109438ba3e2520A29972BE91ec9bA7d06D2339)
```

### Error 2: ManagerLocked
When attempting to add liquidity directly through the hook:
```
[Revert] ManagerLocked()
```

## What We've Tried

1. **Address Prefix Validation**
   - Mined salt (442) to get correct address prefix `0x1110`
   - Verified hook permissions match the address prefix
   - Confirmed hook is deployed and has correct code

2. **Unlock Pattern**
   - Created LiquidityHelper contract implementing IUnlockCallback
   - Attempted to initialize pool through `poolManager.unlock()` -> `unlockCallback()` -> `poolManager.initialize()`
   - Still receives HookAddressNotValid error

3. **Direct Hook Calls**
   - Attempted to call `hook.addLiquidity()` directly
   - Fails with ManagerLocked error when trying to mint tokens

## Code Snippets

### Pool Key Construction
```solidity
PoolKey memory poolKey = PoolKey({
    currency0: Currency.wrap(0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1), // YES token
    currency1: Currency.wrap(0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5), // NO token
    fee: 3000,
    tickSpacing: 60,
    hooks: IHooks(0x11109438ba3e2520A29972BE91ec9bA7d06D2339)
});
```

### Hook Permissions
```solidity
function getHookPermissions() public pure returns (Hooks.Permissions memory) {
    return Hooks.Permissions({
        beforeInitialize: false,
        afterInitialize: false,
        beforeAddLiquidity: true,
        afterAddLiquidity: false,
        beforeRemoveLiquidity: false,
        afterRemoveLiquidity: false,
        beforeSwap: true,
        afterSwap: false,
        beforeDonate: false,
        afterDonate: false,
        beforeSwapReturnDelta: true,
        afterSwapReturnDelta: false,
        afterAddLiquidityReturnDelta: false,
        afterRemoveLiquidityReturnDelta: false
    });
}
```

## Transaction Traces

### Initialize Attempt
```
[13410] LiquidityHelper::initializePool(...)
  ├─ [6887] PoolManager::unlock(data)
  │   ├─ [5714] LiquidityHelper::unlockCallback(data)
  │   │   ├─ [1329] PoolManager::initialize(poolKey, sqrtPriceX96)
  │   │   │   └─ ← [Revert] HookAddressNotValid(0x11109438ba3e2520A29972BE91ec9bA7d06D2339)
```

### Add Liquidity Attempt
```
[50582] Hook::addLiquidity(poolKey, 3000000, 2000001)
  ├─ [40414] YESToken::transferFrom(user, poolManager, 3000000) ✓
  ├─ [455] PoolManager::mint(hook, currencyId, 3000000)
  │   └─ ← [Revert] ManagerLocked()
```

## Questions for Investigation

1. **Hook Validation Logic**: Is there additional validation beyond the address prefix check that we're missing?

2. **Registration Requirement**: Does the hook need to be registered or whitelisted with the pool manager before use?

3. **Permission Flags**: Are the permission flags being validated differently than expected? The address prefix matches but validation still fails.

4. **Pool Manager State**: Is the pool manager in a specific state that prevents new pool initialization?

5. **Chain-Specific Issues**: Are there Polygon-specific requirements or configurations for Uniswap V4 that differ from other chains?

## Desired Outcome
Successfully initialize a pool with our hook and add liquidity with:
- 3,000,000 wei YES tokens (representing $3)
- 2,000,001 wei NO tokens (representing $2)
- Initial probability: 80% YES, 20% NO

## Additional Context
- This is a prediction market implementation using constant sum AMM
- The hook has been successfully deployed multiple times with different addresses
- The pool manager contract is the official Uniswap V4 deployment on Polygon
- All token approvals and transfers work correctly until the pool manager operations