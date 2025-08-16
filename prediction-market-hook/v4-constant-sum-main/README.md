# v4-constant-sum
### **Constant-sum swap on Uniswap v4 🦄**

> **This repo is not production ready, and only serves as an example for custom curves on v4**

With [recent changes](https://github.com/Uniswap/v4-core/pull/404) to v4, Hooks can swap on custom curves!

`v4-constant-sum` implements constant-sum swaps (*x + y = k*), allowing for an exact 1:1 swap everytime

---

## Methodology

2. The hook will hold its own token balances (as liquidity for the constant-sum curve)

3. The `beforeSwap` hook will handle the constant-sum curve:
    1. inbound tokens are taken from the PoolManager
        * this creates a debt, that is paid for by the swapper via the swap router
        * the inbound token is added to the hook's reserves
    2. an *equivalent* number of outbound tokens is sent from the hook to the PoolManager
        * the outbound token is removed from the hook's reserves
        * this creates a credit -- the swap router claims it and sends it to the swapper

---

## Critical Bug Fix in `PredictionMarketHook.sol`

A critical bug was discovered and fixed in the `_beforeSwap` function of the `PredictionMarketHook.sol` contract.

### The Bug

The `returnDelta` in the `_beforeSwap` hook was calculated incorrectly. This value tells the Uniswap v4 PoolManager how to adjust a swapper's token balances. The bug caused the swapper's balances to be adjusted in the wrong direction, effectively reversing the swap.

### Impact

This bug would have made swaps fail, allowing users to drain the contract of one token and breaking the prediction market's functionality.

### The Fix

The logic was corrected to use `params.zeroForOne` to determine the swap direction. The `returnDelta` now correctly debits the token being sold and credits the token being bought.

**Before (Buggy Code):**
```solidity
int128 tokenAmount = amount.toInt128();
BeforeSwapDelta returnDelta =
    isExactInput ? toBeforeSwapDelta(tokenAmount, -tokenAmount) : toBeforeSwapDelta(-tokenAmount, tokenAmount);
```

**After (Fixed Code):**
```solidity
BeforeSwapDelta returnDelta;
if (params.zeroForOne) {
    // Swapper gives currency0, receives currency1.
    returnDelta = toBeforeSwapDelta(-amount.toInt128(), amount.toInt128());
} else {
    // Swapper gives currency1, receives currency0.
    returnDelta = toBeforeSwapDelta(amount.toInt128(), -amount.toInt128());
}
```

---

Additional resources:

[v4-template](https://github.com/uniswapfoundation/v4-template) provides a minimal template and environment for developing v4 hooks

[Uniswap v4 docs](https://docs.uniswap.org/contracts/v4/overview)

[v4-periphery](https://github.com/uniswap/v4-periphery) contains advanced hook implementations that serve as a great reference

[v4-core](https://github.com/uniswap/v4-core)

[v4-by-example](https://v4-by-example.org)

