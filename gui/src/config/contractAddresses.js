// Contract addresses for Polygon
export const ERC1155_ADDRESS = '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045'; // CTF Exchange
export const WRAPPER_FACTORY_ADDRESS = '0xC14F5D2B9D6945ef1Ba93F8DB20294B90FA5B5B1';

// Uniswap V4 Hook and PoolManager
export const HOOK_ADDRESS = '0x4a8AE4911c363f2669215fb5b330132EA41a532c'; // FlexiblePredictionHook
export const POOL_MANAGER_ADDRESS = '0x67366782805870060151383F4BbFF9daB53e5cD6'; // V4 PoolManager

// Token IDs for the prediction market
export const YES_TOKEN_ID = '65880048952541620153230365826580171049439578129923156747663728476967119230732';
export const NO_TOKEN_ID = '106277356443369138797049499065953438334187241175412976556484145976288075138631';

// Wrapped token addresses
export const YES_TOKEN_ADDRESS = '0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1';
export const NO_TOKEN_ADDRESS = '0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5';

// POL Token (native on Polygon)
export const POL_TOKEN = {
  address: '0x0000000000000000000000000000000000001010',
  symbol: 'POL',
  decimals: 18
};

// Pool Key for the prediction market
export const POOL_KEY = {
  currency0: YES_TOKEN_ADDRESS,
  currency1: NO_TOKEN_ADDRESS,
  fee: 3000, // 0.3%
  tickSpacing: 60,
  hooks: HOOK_ADDRESS
};