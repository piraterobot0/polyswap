// Initialize the pool first
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const CONFIG = {
  rpcUrl: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
  privateKey: process.env.PRIVATE_KEY,
  poolManager: '0x67366782805870060151383F4BbFF9daB53e5cD6',
  hookAddress: '0x349810b251D655169fAd188CAC0F70c534130327',
  yesToken: '0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1',
  noToken: '0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5',
  fee: 3000,
  tickSpacing: 60
};

const POOL_MANAGER_ABI = [
  'function initialize(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, uint160 sqrtPriceX96) external returns (int24)',
];

async function main() {
  console.log('🏊 Initializing Pool...\n');
  
  const provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcUrl);
  const wallet = new ethers.Wallet(CONFIG.privateKey, provider);
  const poolManager = new ethers.Contract(CONFIG.poolManager, POOL_MANAGER_ABI, wallet);
  
  console.log('Wallet:', wallet.address);
  
  // Create pool key (tokens must be ordered)
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
  
  console.log('Pool Key:');
  console.log('  Token0:', token0);
  console.log('  Token1:', token1);
  console.log('  Fee:', CONFIG.fee);
  console.log('  Tick Spacing:', CONFIG.tickSpacing);
  console.log('  Hook:', CONFIG.hookAddress);
  
  // sqrt(1) * 2^96 - this represents a 1:1 price ratio
  const SQRT_PRICE_1_1 = '79228162514264337593543950336';
  
  console.log('\nInitializing with 1:1 price ratio...');
  console.log('SqrtPriceX96:', SQRT_PRICE_1_1);
  
  try {
    const tx = await poolManager.initialize(poolKey, SQRT_PRICE_1_1, {
      gasLimit: 500000,
      gasPrice: ethers.utils.parseUnits('50', 'gwei')
    });
    
    console.log('\nTransaction sent:', tx.hash);
    console.log('View on Polygonscan: https://polygonscan.com/tx/' + tx.hash);
    console.log('Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('\n✅ Pool initialized successfully!');
    console.log('Block:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());
    
  } catch (error) {
    if (error.message.includes('PoolAlreadyInitialized') || 
        error.reason?.includes('already initialized')) {
      console.log('✅ Pool is already initialized');
    } else {
      console.error('Error:', error.message);
      if (error.reason) console.error('Reason:', error.reason);
      if (error.data) console.error('Data:', error.data);
    }
  }
}

main().catch(console.error);