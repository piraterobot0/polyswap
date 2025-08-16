// Pool State Reader using Uniswap V4 SDK
import { ethers } from 'ethers';

// Configuration
const CONFIG = {
  // Polygon Mainnet
  chainId: 137,
  rpcUrl: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
  
  // Contract Addresses
  poolManager: '0x67366782805870060151383F4BbFF9daB53e5cD6',
  hookAddress: '0x349810b251D655169fAd188CAC0F70c534130327',
  
  // Token Addresses
  yesToken: '0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1',
  noToken: '0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5',
  
  // Pool Configuration
  fee: 3000,
  tickSpacing: 60
};

// Pool Manager ABI (minimal)
const POOL_MANAGER_ABI = [
  'function getPool(bytes32 id) external view returns (tuple(uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee) pool)',
  'function getLiquidity(bytes32 id) external view returns (uint128)',
  'function getPosition(bytes32 id, address owner, int24 tickLower, int24 tickUpper, bytes32 salt) external view returns (tuple(uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128) position)',
];

// Hook ABI
const HOOK_ABI = [
  'function totalLiquidity(bytes32 poolId) external view returns (uint256)',
  'function yesReserve(bytes32 poolId) external view returns (uint256)',
  'function noReserve(bytes32 poolId) external view returns (uint256)',
  'function getPrice(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key) external view returns (uint256 yesPrice, uint256 noPrice)',
];

// ERC20 ABI (minimal)
const ERC20_ABI = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
];

async function main() {
  console.log('🔍 Reading Prediction Market Pool State\n');
  
  // Initialize provider (ethers v5)
  const provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcUrl);
  
  // Create contract instances
  const poolManager = new ethers.Contract(CONFIG.poolManager, POOL_MANAGER_ABI, provider);
  const hook = new ethers.Contract(CONFIG.hookAddress, HOOK_ABI, provider);
  const yesToken = new ethers.Contract(CONFIG.yesToken, ERC20_ABI, provider);
  const noToken = new ethers.Contract(CONFIG.noToken, ERC20_ABI, provider);
  
  try {
    // Get token info
    console.log('📊 Token Information:');
    const [yesSymbol, noSymbol, yesName, noName] = await Promise.all([
      yesToken.symbol(),
      noToken.symbol(),
      yesToken.name(),
      noToken.name()
    ]);
    
    console.log(`YES Token: ${yesName} (${yesSymbol})`);
    console.log(`NO Token: ${noName} (${noSymbol})`);
    console.log('');
    
    // Calculate pool ID (this is a simplified version)
    const poolId = calculatePoolId(CONFIG);
    console.log('🔑 Pool ID:', poolId);
    console.log('');
    
    // Try to get pool state from hook
    console.log('📈 Pool Reserves (from Hook):');
    try {
      const totalLiq = await hook.totalLiquidity(poolId);
      console.log('Total Liquidity:', ethers.utils.formatEther(totalLiq), 'tokens');
      
      // Try to get reserves if the hook exposes them
      try {
        const yesReserve = await hook.yesReserve(poolId);
        const noReserve = await hook.noReserve(poolId);
        console.log('YES Reserve:', ethers.utils.formatEther(yesReserve), 'tokens');
        console.log('NO Reserve:', ethers.utils.formatEther(noReserve), 'tokens');
        
        // Calculate prices from reserves
        const total = Number(ethers.utils.formatEther(yesReserve)) + Number(ethers.utils.formatEther(noReserve));
        if (total > 0) {
          const yesPrice = (Number(ethers.utils.formatEther(yesReserve)) / total * 100).toFixed(2);
          const noPrice = (Number(ethers.utils.formatEther(noReserve)) / total * 100).toFixed(2);
          console.log('');
          console.log('💰 Current Prices:');
          console.log(`YES: ${yesPrice}%`);
          console.log(`NO: ${noPrice}%`);
        }
      } catch (e) {
        console.log('Note: Reserve data not directly accessible from hook');
      }
    } catch (e) {
      console.log('Error reading pool state:', e.message);
    }
    
    // Get token balances in hook
    console.log('\n🏦 Hook Token Balances:');
    const [yesBalance, noBalance] = await Promise.all([
      yesToken.balanceOf(CONFIG.hookAddress),
      noToken.balanceOf(CONFIG.hookAddress)
    ]);
    
    console.log('YES Balance in Hook:', ethers.utils.formatEther(yesBalance), yesSymbol);
    console.log('NO Balance in Hook:', ethers.utils.formatEther(noBalance), noSymbol);
    
    // Calculate implied price from balances (if liquidity exists)
    const totalBalance = Number(ethers.utils.formatEther(yesBalance)) + Number(ethers.utils.formatEther(noBalance));
    if (totalBalance > 0) {
      console.log('\n📊 Implied Market Probability:');
      const impliedYesProb = (Number(ethers.utils.formatEther(yesBalance)) / totalBalance * 100).toFixed(2);
      const impliedNoProb = (Number(ethers.utils.formatEther(noBalance)) / totalBalance * 100).toFixed(2);
      console.log(`YES: ${impliedYesProb}% (${ethers.utils.formatEther(yesBalance)} tokens)`);
      console.log(`NO: ${impliedNoProb}% (${ethers.utils.formatEther(noBalance)} tokens)`);
    }
    
    // Get total supplies
    console.log('\n📈 Token Supplies:');
    const [yesSupply, noSupply] = await Promise.all([
      yesToken.totalSupply(),
      noToken.totalSupply()
    ]);
    
    console.log('YES Total Supply:', ethers.utils.formatEther(yesSupply), yesSymbol);
    console.log('NO Total Supply:', ethers.utils.formatEther(noSupply), noSymbol);
    
    console.log('\n✅ Pool state reading complete!');
    
  } catch (error) {
    console.error('Error reading pool state:', error);
  }
}

// Helper function to calculate pool ID
function calculatePoolId(config) {
  // Order tokens
  const token0 = config.yesToken.toLowerCase() < config.noToken.toLowerCase() 
    ? config.yesToken.toLowerCase() 
    : config.noToken.toLowerCase();
  const token1 = config.yesToken.toLowerCase() < config.noToken.toLowerCase() 
    ? config.noToken.toLowerCase() 
    : config.yesToken.toLowerCase();
  
  // Create pool key and hash it (ethers v5)
  const abiCoder = new ethers.utils.AbiCoder();
  const encodedKey = abiCoder.encode(
    ['address', 'address', 'uint24', 'int24', 'address'],
    [token0, token1, config.fee, config.tickSpacing, config.hookAddress]
  );
  
  return ethers.utils.keccak256(encodedKey);
}

// Run the script
main().catch(console.error);