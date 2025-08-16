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

### Impact & Output Interpretation

This bug would have made swaps fail, allowing users to drain the contract of one token and breaking the prediction market's functionality.

#### **What the Buggy Code Did (Incorrect Output)**

Let's say a user wants to swap 100 of `TokenA` (currency0) for 100 of `TokenB` (currency1).

**Buggy Code Snippet:**
```solidity
int128 tokenAmount = amount.toInt128(); // amount is 100
BeforeSwapDelta returnDelta =
    isExactInput ? toBeforeSwapDelta(tokenAmount, -tokenAmount) : toBeforeSwapDelta(-tokenAmount, tokenAmount);
```

*   **Expected `returnDelta`**: `(-100, 100)` — Decrease the user's `TokenA` balance by 100 and increase their `TokenB` balance by 100.
*   **Actual `returnDelta`**: `(100, -100)` — The code would incorrectly instruct the PoolManager to **increase** the user's `TokenA` balance and **decrease** their `TokenB` balance. The user would essentially get their original tokens back while the hook's internal accounting would be incorrect, leading to a vulnerability.

#### **What the Corrected Code Does (Correct Output)**

The fix ensures the `returnDelta` correctly reflects the debits and credits from the user's perspective.

**Corrected Code Snippet:**
```solidity
BeforeSwapDelta returnDelta;
if (params.zeroForOne) { // Swapping TokenA (currency0) for TokenB (currency1)
    returnDelta = toBeforeSwapDelta(-amount.toInt128(), amount.toInt128());
} else { // Swapping TokenB for TokenA
    returnDelta = toBeforeSwapDelta(amount.toInt128(), -amount.toInt128());
}
```

*   **Correct `returnDelta`**: `(-100, 100)` — The code now correctly instructs the PoolManager to decrease the user's `TokenA` balance by 100 and increase their `TokenB` balance by 100. The swap executes as intended.

---

Additional resources:

[v4-template](https://github.com/uniswapfoundation/v4-template) provides a minimal template and environment for developing v4 hooks

[Uniswap v4 docs](https://docs.uniswap.org/contracts/v4/overview)

[v4-periphery](https://github.com/uniswap/v4-periphery) contains advanced hook implementations that serve as a great reference

[v4-core](https://github.com/uniswap/v4-core)

[v4-by-example](https://v4-by-example.org)

