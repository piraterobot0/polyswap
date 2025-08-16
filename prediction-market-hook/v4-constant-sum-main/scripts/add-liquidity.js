// Add Liquidity to Prediction Market Pool
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuration
const CONFIG = {
  chainId: 137,
  rpcUrl: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
  privateKey: process.env.PRIVATE_KEY,
  
  // Contract Addresses
  poolManager: process.env.POOLMANAGER || '0x67366782805870060151383F4BbFF9daB53e5cD6',
  hookAddress: process.env.HOOK_ADDRESS || '0x349810b251D655169fAd188CAC0F70c534130327',
  yesToken: process.env.YES_TOKEN || '0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1',
  noToken: process.env.NO_TOKEN || '0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5',
  
  fee: 3000,
  tickSpacing: 60
};

// ABIs
const POOL_MANAGER_ABI = [
  'function initialize(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, uint160 sqrtPriceX96) external returns (int24)',
];

const HOOK_ABI = [
  'function addInitialLiquidity(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, uint256 totalAmount) external',
  'function totalLiquidity(bytes32 poolId) external view returns (uint256)',
  'function yesReserve(bytes32 poolId) external view returns (uint256)',
  'function noReserve(bytes32 poolId) external view returns (uint256)',
];

const ERC20_ABI = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
];

async function main() {
  console.log('💧 Adding Liquidity to Prediction Market Pool\n');
  
  if (!CONFIG.privateKey) {
    console.error('❌ No private key found in .env file');
    return;
  }
  
  // Initialize provider and wallet
  const provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcUrl);
  const wallet = new ethers.Wallet(CONFIG.privateKey, provider);
  
  console.log('👛 Wallet Address:', wallet.address);
  
  // Get contracts
  const poolManager = new ethers.Contract(CONFIG.poolManager, POOL_MANAGER_ABI, wallet);
  const hook = new ethers.Contract(CONFIG.hookAddress, HOOK_ABI, wallet);
  const yesToken = new ethers.Contract(CONFIG.yesToken, ERC20_ABI, wallet);
  const noToken = new ethers.Contract(CONFIG.noToken, ERC20_ABI, wallet);
  
  try {
    // Check wallet balances
    console.log('\n📊 Checking Balances...');
    const [yesBalance, noBalance, maticBalance] = await Promise.all([
      yesToken.balanceOf(wallet.address),
      noToken.balanceOf(wallet.address),
      provider.getBalance(wallet.address)
    ]);
    
    console.log('MATIC:', ethers.utils.formatEther(maticBalance));
    console.log('YES:', ethers.utils.formatEther(yesBalance), 'wPOSI-YES');
    console.log('NO:', ethers.utils.formatEther(noBalance), 'wPOSI-NO');
    
    if (maticBalance.eq(0)) {
      console.error('\n❌ No MATIC for gas fees');
      return;
    }
    
    // Calculate pool ID
    const poolId = calculatePoolId(CONFIG);
    console.log('\n🔑 Pool ID:', poolId);
    
    // Check current liquidity
    const currentLiquidity = await hook.totalLiquidity(poolId);
    console.log('Current Liquidity:', ethers.utils.formatEther(currentLiquidity), 'tokens');
    
    if (!currentLiquidity.eq(0)) {
      console.log('\n⚠️  Pool already has liquidity');
      
      try {
        const yesReserve = await hook.yesReserve(poolId);
        const noReserve = await hook.noReserve(poolId);
        console.log('YES Reserve:', ethers.utils.formatEther(yesReserve));
        console.log('NO Reserve:', ethers.utils.formatEther(noReserve));
      } catch (e) {
        console.log('Could not read reserves');
      }
      
      return;
    }
    
    // Determine liquidity amount based on balances
    const totalTokens = yesBalance.add(noBalance);
    
    if (totalTokens.eq(0)) {
      console.log('\n❌ No YES or NO tokens to add as liquidity');
      console.log('\n💡 To get tokens:');
      console.log('1. Wrap Polymarket ERC-1155 positions to ERC-20');
      console.log('2. Or get test tokens from a faucet');
      return;
    }
    
    // Use the smaller of the two balances (or total if we want to use both)
    const liquidityAmount = yesBalance.lt(noBalance) ? yesBalance.mul(2) : noBalance.mul(2);
    
    console.log('\n💰 Adding Liquidity:');
    console.log('Amount:', ethers.utils.formatEther(liquidityAmount), 'total tokens');
    console.log('This will create:');
    console.log('- YES Reserve: 80% =', ethers.utils.formatEther(liquidityAmount.mul(80).div(100)), 'tokens');
    console.log('- NO Reserve: 20% =', ethers.utils.formatEther(liquidityAmount.mul(20).div(100)), 'tokens');
    
    // Approve tokens
    console.log('\n✅ Approving tokens...');
    
    const yesAllowance = await yesToken.allowance(wallet.address, CONFIG.hookAddress);
    const noAllowance = await noToken.allowance(wallet.address, CONFIG.hookAddress);
    
    if (yesAllowance.lt(liquidityAmount)) {
      console.log('Approving YES tokens...');
      const approveTx = await yesToken.approve(CONFIG.hookAddress, ethers.constants.MaxUint256);
      await approveTx.wait();
      console.log('YES approved');
    }
    
    if (noAllowance.lt(liquidityAmount)) {
      console.log('Approving NO tokens...');
      const approveTx = await noToken.approve(CONFIG.hookAddress, ethers.constants.MaxUint256);
      await approveTx.wait();
      console.log('NO approved');
    }
    
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
    
    // Initialize pool if needed
    console.log('\n🏊 Initializing pool...');
    const SQRT_PRICE_1_1 = '79228162514264337593543950336'; // sqrt(1) * 2^96
    
    try {
      const initTx = await poolManager.initialize(poolKey, SQRT_PRICE_1_1);
      console.log('Initialize tx:', initTx.hash);
      await initTx.wait();
      console.log('Pool initialized');
    } catch (e) {
      if (e.message.includes('already initialized')) {
        console.log('Pool already initialized');
      } else {
        console.error('Initialize failed:', e.message);
      }
    }
    
    // Add liquidity
    console.log('\n💧 Adding initial liquidity...');
    const addLiqTx = await hook.addInitialLiquidity(poolKey, liquidityAmount);
    console.log('Add liquidity tx:', addLiqTx.hash);
    
    const receipt = await addLiqTx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    
    // Verify the liquidity was added
    console.log('\n✅ Verifying liquidity...');
    const newLiquidity = await hook.totalLiquidity(poolId);
    console.log('New Total Liquidity:', ethers.utils.formatEther(newLiquidity), 'tokens');
    
    try {
      const yesReserve = await hook.yesReserve(poolId);
      const noReserve = await hook.noReserve(poolId);
      console.log('YES Reserve:', ethers.utils.formatEther(yesReserve), '(80%)');
      console.log('NO Reserve:', ethers.utils.formatEther(noReserve), '(20%)');
      
      // Calculate prices
      const total = Number(ethers.utils.formatEther(yesReserve)) + Number(ethers.utils.formatEther(noReserve));
      if (total > 0) {
        const yesPrice = (Number(ethers.utils.formatEther(yesReserve)) / total * 100).toFixed(2);
        const noPrice = (Number(ethers.utils.formatEther(noReserve)) / total * 100).toFixed(2);
        console.log('\n💰 Market Prices:');
        console.log(`YES: ${yesPrice}%`);
        console.log(`NO: ${noPrice}%`);
      }
    } catch (e) {
      console.log('Could not read reserves');
    }
    
    console.log('\n🎉 Liquidity added successfully!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.data) {
      console.error('Error data:', error.data);
    }
  }
}

// Helper function to calculate pool ID
function calculatePoolId(config) {
  const token0 = config.yesToken.toLowerCase() < config.noToken.toLowerCase() 
    ? config.yesToken.toLowerCase() 
    : config.noToken.toLowerCase();
  const token1 = config.yesToken.toLowerCase() < config.noToken.toLowerCase() 
    ? config.noToken.toLowerCase() 
    : config.yesToken.toLowerCase();
  
  const abiCoder = new ethers.utils.AbiCoder();
  const encodedKey = abiCoder.encode(
    ['address', 'address', 'uint24', 'int24', 'address'],
    [token0, token1, config.fee, config.tickSpacing, config.hookAddress]
  );
  
  return ethers.utils.keccak256(encodedKey);
}

// Run the script
main().catch(console.error);