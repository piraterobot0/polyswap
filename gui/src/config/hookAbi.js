// FlexiblePredictionHook ABI - only the functions we need for the UI
export const HOOK_ABI = [
  // View functions
  {
    "inputs": [
      {
        "components": [
          { "name": "currency0", "type": "address" },
          { "name": "currency1", "type": "address" },
          { "name": "fee", "type": "uint24" },
          { "name": "tickSpacing", "type": "int24" },
          { "name": "hooks", "type": "address" }
        ],
        "name": "key",
        "type": "tuple"
      }
    ],
    "name": "getPoolInfo",
    "outputs": [
      { "name": "liquidity", "type": "uint256" },
      { "name": "r0", "type": "uint256" },
      { "name": "r1", "type": "uint256" },
      { "name": "price0", "type": "uint256" },
      { "name": "price1", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          { "name": "currency0", "type": "address" },
          { "name": "currency1", "type": "address" },
          { "name": "fee", "type": "uint24" },
          { "name": "tickSpacing", "type": "int24" },
          { "name": "hooks", "type": "address" }
        ],
        "name": "key",
        "type": "tuple"
      }
    ],
    "name": "getReserves",
    "outputs": [
      { "name": "r0", "type": "uint256" },
      { "name": "r1", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          { "name": "currency0", "type": "address" },
          { "name": "currency1", "type": "address" },
          { "name": "fee", "type": "uint24" },
          { "name": "tickSpacing", "type": "int24" },
          { "name": "hooks", "type": "address" }
        ],
        "name": "key",
        "type": "tuple"
      }
    ],
    "name": "getPrices",
    "outputs": [
      { "name": "price0", "type": "uint256" },
      { "name": "price1", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Write functions
  {
    "inputs": [
      {
        "components": [
          { "name": "currency0", "type": "address" },
          { "name": "currency1", "type": "address" },
          { "name": "fee", "type": "uint24" },
          { "name": "tickSpacing", "type": "int24" },
          { "name": "hooks", "type": "address" }
        ],
        "name": "key",
        "type": "tuple"
      },
      { "name": "amount0", "type": "uint256" },
      { "name": "amount1", "type": "uint256" }
    ],
    "name": "addLiquidity",
    "outputs": [
      { "name": "shares", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          { "name": "currency0", "type": "address" },
          { "name": "currency1", "type": "address" },
          { "name": "fee", "type": "uint24" },
          { "name": "tickSpacing", "type": "int24" },
          { "name": "hooks", "type": "address" }
        ],
        "name": "key",
        "type": "tuple"
      }
    ],
    "name": "addAvailableLiquidity",
    "outputs": [
      { "name": "shares", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "poolId", "type": "bytes32" },
      { "indexed": true, "name": "provider", "type": "address" },
      { "indexed": false, "name": "amount0", "type": "uint256" },
      { "indexed": false, "name": "amount1", "type": "uint256" },
      { "indexed": false, "name": "shares", "type": "uint256" }
    ],
    "name": "LiquidityAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "poolId", "type": "bytes32" },
      { "indexed": false, "name": "zeroForOne", "type": "bool" },
      { "indexed": false, "name": "amountIn", "type": "uint256" },
      { "indexed": false, "name": "amountOut", "type": "uint256" }
    ],
    "name": "SwapExecuted",
    "type": "event"
  }
];

// V4 Router ABI for swaps (simplified)
export const V4_ROUTER_ABI = [
  {
    "inputs": [
      {
        "components": [
          { "name": "currency0", "type": "address" },
          { "name": "currency1", "type": "address" },
          { "name": "fee", "type": "uint24" },
          { "name": "tickSpacing", "type": "int24" },
          { "name": "hooks", "type": "address" }
        ],
        "name": "key",
        "type": "tuple"
      },
      {
        "components": [
          { "name": "zeroForOne", "type": "bool" },
          { "name": "amountSpecified", "type": "int256" },
          { "name": "sqrtPriceLimitX96", "type": "uint160" }
        ],
        "name": "params",
        "type": "tuple"
      },
      { "name": "hookData", "type": "bytes" }
    ],
    "name": "swap",
    "outputs": [
      { "name": "delta", "type": "int256" }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
];