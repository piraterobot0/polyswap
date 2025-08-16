// Continue adding liquidity (assuming approvals are done)
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const CONFIG = {
  chainId: 137,
  rpcUrl: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
  privateKey: process.env.PRIVATE_KEY,
  poolManager: '0x67366782805870060151383F4BbFF9daB53e5cD6',
  hookAddress: '0x349810b251D655169fAd188CAC0F70c534130327',
  yesToken: '0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1',
  noToken: '0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5',
  fee: 3000,
  tickSpacing: 60
};

const HOOK_ABI = [
  'function addInitialLiquidity(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, uint256 totalAmount) external',
  'function totalLiquidity(bytes32 poolId) external view returns (uint256)',
];

async function main() {
  console.log('💧 Continuing Liquidity Addition...\n');
  
  const provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcUrl);
  const wallet = new ethers.Wallet(CONFIG.privateKey, provider);
  const hook = new ethers.Contract(CONFIG.hookAddress, HOOK_ABI, wallet);
  
  console.log('Wallet:', wallet.address);
  
  // Create pool key
  const [token0, token1] = CONFIG.yesToken.toLowerCase() < CONFIG.noToken.toLowerCase()
    ? [CONFIG.yesToken, CONFIG.noToken]
    : [CONFIG.noToken, CONFIG.yesToken];
  
  const poolKey = {
    currency0: token0,
    currency1: token1,
    fee: CONFIG.fee,
    tickSpacing: CONFIG.tickSpacing,
    hooks: CONFIG.hookAddress
  };
  
  // Calculate pool ID
  const abiCoder = new ethers.utils.AbiCoder();
  const encodedKey = abiCoder.encode(
    ['address', 'address', 'uint24', 'int24', 'address'],
    [token0, token1, CONFIG.fee, CONFIG.tickSpacing, CONFIG.hookAddress]
  );
  const poolId = ethers.utils.keccak256(encodedKey);
  
  // Check current liquidity
  const currentLiquidity = await hook.totalLiquidity(poolId);
  console.log('Current Liquidity:', currentLiquidity.toString(), 'wei');
  
  if (!currentLiquidity.eq(0)) {
    console.log('✅ Pool already has liquidity!');
    console.log('Amount:', ethers.utils.formatEther(currentLiquidity), 'tokens');
    return;
  }
  
  // Add liquidity with minimal amount
  const liquidityAmount = ethers.BigNumber.from('5000001'); // Total of our tokens
  
  console.log('\nAdding liquidity:', liquidityAmount.toString(), 'wei');
  console.log('Sending transaction...');
  
  try {
    const tx = await hook.addInitialLiquidity(poolKey, liquidityAmount, {
      gasLimit: 1000000,
      gasPrice: ethers.utils.parseUnits('50', 'gwei') // Set reasonable gas price
    });
    
    console.log('Transaction sent:', tx.hash);
    console.log('View on Polygonscan: https://polygonscan.com/tx/' + tx.hash);
    console.log('Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('\n✅ Success!');
    console.log('Block:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());
    
    // Verify
    const newLiquidity = await hook.totalLiquidity(poolId);
    console.log('\nNew liquidity:', newLiquidity.toString(), 'wei');
    console.log('Formatted:', ethers.utils.formatEther(newLiquidity), 'tokens');
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.reason) console.error('Reason:', error.reason);
    if (error.code) console.error('Code:', error.code);
  }
}

main().catch(console.error);