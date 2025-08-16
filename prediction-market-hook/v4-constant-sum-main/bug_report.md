# Critical Bug Fix in `PredictionMarketHook.sol`

This document provides details on a critical bug discovered and fixed in the `_beforeSwap` function of the `PredictionMarketHook.sol` contract.

## Summary

A critical bug was identified in the calculation of the `BeforeSwapDelta` return value within the `_beforeSwap` hook. This bug caused an incorrect adjustment of the swapper's token balances in the Uniswap v4 PoolManager, effectively reversing the outcome of every swap.

## The Bug Explained

The `_beforeSwap` hook is responsible for telling the PoolManager how to adjust a swapper's token balances after a trade. This is done via the `BeforeSwapDelta` return value, which specifies the change in `currency0` and `currency1` for the user.

The original implementation calculated this delta incorrectly. Instead of debiting the token the user was selling and crediting the token they were buying, it did the opposite. For example, if a user swapped `TokenA` for `TokenB`, the buggy code would instruct the PoolManager to give them back more `TokenA` and take away the `TokenB` they were supposed to receive.

### Before (Buggy Code)

```solidity
// --- CRITICAL BUG IDENTIFIED ---
// The `returnDelta` tells the PoolManager how to adjust the CALLER'S balance.
// The current logic has the signs reversed.
// For an exact input swap (`isExactInput` = true), the caller is giving tokens, so their balance should decrease.
// The current implementation `toBeforeSwapDelta(tokenAmount, -tokenAmount)` would INCREASE their balance of the input token.
int128 tokenAmount = amount.toInt128();
BeforeSwapDelta returnDelta =
    isExactInput ? toBeforeSwapDelta(tokenAmount, -tokenAmount) : toBeforeSwapDelta(-tokenAmount, tokenAmount);

return (BaseHook.beforeSwap.selector, returnDelta, 0);
```

## Impact

If left unfixed, this bug would have had the following consequences:
- **Incorrect Swaps**: Users would not receive the tokens they purchased.
- **Balance Drain**: The hook's internal accounting would become inconsistent with the PoolManager's balances, allowing users to drain the contract of one of the tokens.
- **Broken Market**: The prediction market's core functionality would be completely broken, rendering it unusable.

## The Fix

The bug was fixed by replacing the faulty calculation with logic that correctly determines the direction of the swap based on the `params.zeroForOne` boolean. This ensures that the swapper's balance is debited for the token they sell and credited for the token they buy.

### After (Fixed Code)

```solidity
// --- BUG FIX ---
// The original `returnDelta` logic incorrectly adjusted the swapper's balance.
// This has been corrected to ensure the swapper's balance of the token they are selling decreases,
// and the balance of the token they are buying increases.
// The logic now correctly reflects the direction of the swap (`params.zeroForOne`).
BeforeSwapDelta returnDelta;
if (params.zeroForOne) {
    // Swapper gives currency0, receives currency1.
    // Decrease currency0 balance, increase currency1 balance.
    returnDelta = toBeforeSwapDelta(-amount.toInt128(), amount.toInt128());
} else {
    // Swapper gives currency1, receives currency0.
    // Increase currency0 balance, decrease currency1 balance.
    returnDelta = toBeforeSwapDelta(amount.toInt128(), -amount.toInt128());
}

return (BaseHook.beforeSwap.selector, returnDelta, 0);
```
