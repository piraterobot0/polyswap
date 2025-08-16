// Quick add liquidity without waiting
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const CONFIG = {
  hookAddress: '0x4a8AE4911c363f2669215fb5b330132EA41a532c',
  poolManager: '0x67366782805870060151383F4BbFF9daB53e5cD6',
  yesToken: '0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1',
  noToken: '0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5',
  fee: 3000,
  tickSpacing: 60,
  privateKey: process.env.PRIVATE_KEY,
  rpcUrl: 'https://polygon-rpc.com'
};

const HOOK_ABI = [
  'function addAvailableLiquidity(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key) external',
  'function getPoolInfo(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key) external view returns (uint256 liquidity, uint256 r0, uint256 r1, uint256 price0, uint256 price1)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
];

async function main() {
  console.log('💧 Quick Add Liquidity\n');
  
  const provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcUrl);
  const wallet = new ethers.Wallet(CONFIG.privateKey, provider);
  
  const hook = new ethers.Contract(CONFIG.hookAddress, HOOK_ABI, wallet);
  const yesToken = new ethers.Contract(CONFIG.yesToken, ERC20_ABI, wallet);
  const noToken = new ethers.Contract(CONFIG.noToken, ERC20_ABI, wallet);
  
  const poolKey = {
    currency0: CONFIG.yesToken,
    currency1: CONFIG.noToken,
    fee: CONFIG.fee,
    tickSpacing: CONFIG.tickSpacing,
    hooks: CONFIG.hookAddress
  };
  
  // Check current state
  const poolInfo = await hook.getPoolInfo(poolKey);
  console.log('Current liquidity:', poolInfo.liquidity.toString());
  
  if (!poolInfo.liquidity.eq(0)) {
    console.log('✅ Pool already has liquidity!');
    console.log('Reserve0 (YES):', poolInfo.r0.toString(), 'wei');
    console.log('Reserve1 (NO):', poolInfo.r1.toString(), 'wei');
    return;
  }
  
  // Approve tokens (fire and forget)
  console.log('\nApproving tokens...');
  yesToken.approve(CONFIG.hookAddress, ethers.constants.MaxUint256, { gasLimit: 100000 });
  noToken.approve(CONFIG.hookAddress, ethers.constants.MaxUint256, { gasLimit: 100000 });
  
  // Wait a bit for approvals
  await new Promise(r => setTimeout(r, 5000));
  
  // Add liquidity
  console.log('\nAdding available liquidity...');
  const tx = await hook.addAvailableLiquidity(poolKey, {
    gasLimit: 1000000,
    gasPrice: ethers.utils.parseUnits('50', 'gwei')
  });
  
  console.log('Transaction sent:', tx.hash);
  console.log('View on Polygonscan: https://polygonscan.com/tx/' + tx.hash);
  
  // Don't wait, just exit
  console.log('\n✅ Transaction sent! Check Polygonscan for confirmation.');
}

main().catch(console.error);