// Add Minimal Liquidity with Available Tokens
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
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
];

async function main() {
  console.log('💧 Adding Minimal Liquidity to Prediction Market Pool\n');
  
  if (!CONFIG.privateKey) {
    console.error('❌ No private key found in .env file');
    return;
  }
  
  // Initialize provider and wallet
  const provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcUrl);
  const wallet = new ethers.Wallet(CONFIG.privateKey, provider);
  
  console.log('👛 Wallet Address:', wallet.address);
  console.log('✅ This is the deployment wallet!\n');
  
  // Get contracts
  const poolManager = new ethers.Contract(CONFIG.poolManager, POOL_MANAGER_ABI, wallet);
  const hook = new ethers.Contract(CONFIG.hookAddress, HOOK_ABI, wallet);
  const yesToken = new ethers.Contract(CONFIG.yesToken, ERC20_ABI, wallet);
  const noToken = new ethers.Contract(CONFIG.noToken, ERC20_ABI, wallet);
  
  try {
    // Check wallet balances
    console.log('📊 Checking Balances...');
    const [yesBalance, noBalance, maticBalance] = await Promise.all([
      yesToken.balanceOf(wallet.address),
      noToken.balanceOf(wallet.address),
      provider.getBalance(wallet.address)
    ]);
    
    console.log('MATIC:', ethers.utils.formatEther(maticBalance));
    console.log('YES:', yesBalance.toString(), 'wei =', ethers.utils.formatEther(yesBalance));
    console.log('NO:', noBalance.toString(), 'wei =', ethers.utils.formatEther(noBalance));
    
    // Calculate pool ID
    const poolId = calculatePoolId(CONFIG);
    console.log('\n🔑 Pool ID:', poolId);
    
    // Check current liquidity
    const currentLiquidity = await hook.totalLiquidity(poolId);
    console.log('Current Liquidity:', currentLiquidity.toString(), 'wei');
    
    if (!currentLiquidity.eq(0)) {
      console.log('\n⚠️  Pool already has liquidity:', ethers.utils.formatEther(currentLiquidity));
      
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
    
    // Use minimal amount - the sum of what we have
    const totalAvailable = yesBalance.add(noBalance);
    console.log('\n💰 Total tokens available:', totalAvailable.toString(), 'wei');
    
    if (totalAvailable.eq(0)) {
      console.log('❌ No tokens available');
      return;
    }
    
    // For the hook, we'll provide the total amount
    // The hook will split it 80/20 internally
    const liquidityAmount = totalAvailable;
    
    console.log('\n🎯 Adding Liquidity:');
    console.log('Total Amount:', liquidityAmount.toString(), 'wei');
    console.log('This will create (approximately):');
    console.log('- YES Reserve: 80% =', liquidityAmount.mul(80).div(100).toString(), 'wei');
    console.log('- NO Reserve: 20% =', liquidityAmount.mul(20).div(100).toString(), 'wei');
    
    // Approve tokens
    console.log('\n✅ Checking Approvals...');
    
    const yesAllowance = await yesToken.allowance(wallet.address, CONFIG.hookAddress);
    const noAllowance = await noToken.allowance(wallet.address, CONFIG.hookAddress);
    
    if (yesAllowance.lt(yesBalance)) {
      console.log('Approving YES tokens...');
      const approveTx = await yesToken.approve(CONFIG.hookAddress, ethers.constants.MaxUint256);
      console.log('Approval tx:', approveTx.hash);
      await approveTx.wait();
      console.log('YES approved ✓');
    } else {
      console.log('YES already approved ✓');
    }
    
    if (noAllowance.lt(noBalance)) {
      console.log('Approving NO tokens...');
      const approveTx = await noToken.approve(CONFIG.hookAddress, ethers.constants.MaxUint256);
      console.log('Approval tx:', approveTx.hash);
      await approveTx.wait();
      console.log('NO approved ✓');
    } else {
      console.log('NO already approved ✓');
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
    console.log('\n🏊 Checking pool initialization...');
    const SQRT_PRICE_1_1 = '79228162514264337593543950336'; // sqrt(1) * 2^96
    
    try {
      const initTx = await poolManager.initialize(poolKey, SQRT_PRICE_1_1, {
        gasLimit: 500000
      });
      console.log('Initialize tx:', initTx.hash);
      await initTx.wait();
      console.log('Pool initialized ✓');
    } catch (e) {
      if (e.message.includes('already initialized') || e.message.includes('PoolAlreadyInitialized')) {
        console.log('Pool already initialized ✓');
      } else {
        console.log('Initialize error (may already be initialized):', e.message.slice(0, 100));
      }
    }
    
    // Add liquidity
    console.log('\n💧 Adding initial liquidity...');
    console.log('Sending transaction...');
    
    const addLiqTx = await hook.addInitialLiquidity(poolKey, liquidityAmount, {
      gasLimit: 1000000
    });
    console.log('Add liquidity tx:', addLiqTx.hash);
    console.log('Waiting for confirmation...');
    
    const receipt = await addLiqTx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());
    
    // Verify the liquidity was added
    console.log('\n✅ Verifying liquidity...');
    const newLiquidity = await hook.totalLiquidity(poolId);
    console.log('New Total Liquidity:', newLiquidity.toString(), 'wei =', ethers.utils.formatEther(newLiquidity));
    
    try {
      const yesReserve = await hook.yesReserve(poolId);
      const noReserve = await hook.noReserve(poolId);
      console.log('YES Reserve:', yesReserve.toString(), 'wei');
      console.log('NO Reserve:', noReserve.toString(), 'wei');
      
      // Calculate prices
      const total = yesReserve.add(noReserve);
      if (total.gt(0)) {
        const yesPrice = yesReserve.mul(10000).div(total).toNumber() / 100;
        const noPrice = noReserve.mul(10000).div(total).toNumber() / 100;
        console.log('\n💰 Market Prices:');
        console.log(`YES: ${yesPrice.toFixed(2)}%`);
        console.log(`NO: ${noPrice.toFixed(2)}%`);
      }
    } catch (e) {
      console.log('Could not read reserves:', e.message);
    }
    
    console.log('\n🎉 Liquidity added successfully!');
    console.log('Transaction: https://polygonscan.com/tx/' + addLiqTx.hash);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.data) {
      console.error('Error data:', error.data);
    }
    if (error.error) {
      console.error('Error details:', error.error.message || error.error);
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