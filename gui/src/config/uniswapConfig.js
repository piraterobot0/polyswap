// Uniswap V3 Pool Configuration for YES/NO tokens
export const UNISWAP_V3_CONFIG = {
  // Pool created with transactions:
  // 0xe410dcf80735b3880e8623a9cd5ed9effd4edcb67938cd59e9d211e1248d2e77
  // 0x7f0309e22db52802f0628795e1f6d165b272297e2c5ecc955f24237f8eef3b5a
  
  // Uniswap V3 contracts on Polygon
  SWAP_ROUTER: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  QUOTER_V2: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
  POSITION_MANAGER: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
  FACTORY: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  
  // Pool details
  POOL_FEE: 3000, // 0.3%
  
  // Token addresses (wrapped versions)
  YES_TOKEN: '0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1',
  NO_TOKEN: '0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5',
  
  // POL (Wrapped MATIC) on Polygon
  WPOL: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // Wrapped MATIC/POL
  
  // USDC for stable trading pairs (Native USDC on Polygon)
  USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  
  // Pool address (can be calculated or hardcoded after checking transactions)
  POOL_ADDRESS: null, // Will calculate from factory
};

// Uniswap V3 Pool ABI (simplified)
export const UNISWAP_V3_POOL_ABI = [
  {
    "inputs": [],
    "name": "token0",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "token1", 
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fee",
    "outputs": [{ "internalType": "uint24", "name": "", "type": "uint24" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "liquidity",
    "outputs": [{ "internalType": "uint128", "name": "", "type": "uint128" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "slot0",
    "outputs": [
      { "internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160" },
      { "internalType": "int24", "name": "tick", "type": "int24" },
      { "internalType": "uint16", "name": "observationIndex", "type": "uint16" },
      { "internalType": "uint16", "name": "observationCardinality", "type": "uint16" },
      { "internalType": "uint16", "name": "observationCardinalityNext", "type": "uint16" },
      { "internalType": "uint8", "name": "feeProtocol", "type": "uint8" },
      { "internalType": "bool", "name": "unlocked", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "int24", "name": "tickLower", "type": "int24" },
      { "internalType": "int24", "name": "tickUpper", "type": "int24" }
    ],
    "name": "ticks",
    "outputs": [
      { "internalType": "uint128", "name": "liquidityGross", "type": "uint128" },
      { "internalType": "int128", "name": "liquidityNet", "type": "int128" },
      { "internalType": "uint256", "name": "feeGrowthOutside0X128", "type": "uint256" },
      { "internalType": "uint256", "name": "feeGrowthOutside1X128", "type": "uint256" },
      { "internalType": "int56", "name": "tickCumulativeOutside", "type": "int56" },
      { "internalType": "uint160", "name": "secondsPerLiquidityOutsideX128", "type": "uint160" },
      { "internalType": "uint32", "name": "secondsOutside", "type": "uint32" },
      { "internalType": "bool", "name": "initialized", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Uniswap V3 Swap Router ABI
export const SWAP_ROUTER_ABI = [
  {
    "inputs": [
      {
        "components": [
          { "name": "tokenIn", "type": "address" },
          { "name": "tokenOut", "type": "address" },
          { "name": "fee", "type": "uint24" },
          { "name": "recipient", "type": "address" },
          { "name": "deadline", "type": "uint256" },
          { "name": "amountIn", "type": "uint256" },
          { "name": "amountOutMinimum", "type": "uint256" },
          { "name": "sqrtPriceLimitX96", "type": "uint160" }
        ],
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "exactInputSingle",
    "outputs": [{ "name": "amountOut", "type": "uint256" }],
    "stateMutability": "payable",
    "type": "function"
  }
];

// Quoter V2 ABI for getting quotes
export const QUOTER_V2_ABI = [
  {
    "inputs": [
      {
        "components": [
          { "name": "tokenIn", "type": "address" },
          { "name": "tokenOut", "type": "address" },
          { "name": "amountIn", "type": "uint256" },
          { "name": "fee", "type": "uint24" },
          { "name": "sqrtPriceLimitX96", "type": "uint160" }
        ],
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "quoteExactInputSingle",
    "outputs": [
      { "name": "amountOut", "type": "uint256" },
      { "name": "sqrtPriceX96After", "type": "uint160" },
      { "name": "initializedTicksCrossed", "type": "uint32" },
      { "name": "gasEstimate", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Factory ABI to get pool address
export const FACTORY_ABI = [
  {
    "inputs": [
      { "name": "tokenA", "type": "address" },
      { "name": "tokenB", "type": "address" },
      { "name": "fee", "type": "uint24" }
    ],
    "name": "getPool",
    "outputs": [{ "name": "pool", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];