// Check the state of our flexible hook
import { ethers } from 'ethers';

const CONFIG = {
  hookAddress: '0x4a8AE4911c363f2669215fb5b330132EA41a532c', // Our new flexible hook
  yesToken: '0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1',
  noToken: '0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5',
  fee: 3000,
  tickSpacing: 60,
  rpcUrl: 'https://polygon-rpc.com'
};

const HOOK_ABI = [
  'function getPoolInfo(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key) external view returns (uint256 liquidity, uint256 r0, uint256 r1, uint256 price0, uint256 price1)',
  'function totalLiquidity(bytes32) external view returns (uint256)',
  'function reserve0(bytes32) external view returns (uint256)',
  'function reserve1(bytes32) external view returns (uint256)',
];

async function main() {
  console.log('🔍 Checking FlexiblePredictionHook State\n');
  console.log('Hook:', CONFIG.hookAddress);
  
  const provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcUrl);
  const hook = new ethers.Contract(CONFIG.hookAddress, HOOK_ABI, provider);
  
  const poolKey = {
    currency0: CONFIG.yesToken,
    currency1: CONFIG.noToken,
    fee: CONFIG.fee,
    tickSpacing: CONFIG.tickSpacing,
    hooks: CONFIG.hookAddress
  };
  
  try {
    const poolInfo = await hook.getPoolInfo(poolKey);
    
    console.log('\n📊 Pool Information:');
    console.log('Total Liquidity:', poolInfo.liquidity.toString(), 'wei');
    console.log('Reserve0 (YES):', poolInfo.r0.toString(), 'wei');
    console.log('Reserve1 (NO):', poolInfo.r1.toString(), 'wei');
    
    if (poolInfo.liquidity.gt(0)) {
      console.log('\n💰 Market Prices:');
      console.log('YES Price:', poolInfo.price0.toString(), '%');
      console.log('NO Price:', poolInfo.price1.toString(), '%');
      
      console.log('\n✅ Pool has liquidity and is ready for swaps!');
    } else {
      console.log('\n⚠️ Pool has no liquidity yet');
      
      // Check recent transaction
      console.log('\nRecent transaction: 0x0b6b82cf6e123f7f779075249bf4b01e3ef36a52c27ecdd01818ca968c69411a');
      console.log('Check status: https://polygonscan.com/tx/0x0b6b82cf6e123f7f779075249bf4b01e3ef36a52c27ecdd01818ca968c69411a');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main().catch(console.error);