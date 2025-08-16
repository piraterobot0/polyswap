// Setup and add liquidity to the flexible hook
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuration
const CONFIG = {
  hookAddress: '0x4a8AE4911c363f2669215fb5b330132EA41a532c', // Our new flexible hook!
  poolManager: '0x67366782805870060151383F4BbFF9daB53e5cD6',
  yesToken: '0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1',
  noToken: '0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5',
  fee: 3000,
  tickSpacing: 60,
  privateKey: process.env.PRIVATE_KEY,
  rpcUrl: 'https://polygon-rpc.com'
};

// ABIs
const POOL_MANAGER_ABI = [
  'function initialize(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, uint160 sqrtPriceX96) external returns (int24)',
];

const HOOK_ABI = [
  'function addLiquidity(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, uint256 amount0, uint256 amount1) external',
  'function addAvailableLiquidity(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key) external',
  'function getPoolInfo(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key) external view returns (uint256 liquidity, uint256 r0, uint256 r1, uint256 price0, uint256 price1)',
  'function setInitialRatio(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, uint256 ratio0) external',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
];

async function main() {
  console.log('🚀 Setting up FlexiblePredictionHook\n');
  
  const provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcUrl);
  const wallet = new ethers.Wallet(CONFIG.privateKey, provider);
  
  console.log('Wallet:', wallet.address);
  console.log('Hook:', CONFIG.hookAddress);
  
  // Get contracts
  const poolManager = new ethers.Contract(CONFIG.poolManager, POOL_MANAGER_ABI, wallet);
  const hook = new ethers.Contract(CONFIG.hookAddress, HOOK_ABI, wallet);
  const yesToken = new ethers.Contract(CONFIG.yesToken, ERC20_ABI, wallet);
  const noToken = new ethers.Contract(CONFIG.noToken, ERC20_ABI, wallet);
  
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
  
  console.log('\n📊 Pool Key:');
  console.log('Token0:', token0 === CONFIG.yesToken ? 'YES' : 'NO', token0);
  console.log('Token1:', token1 === CONFIG.yesToken ? 'YES' : 'NO', token1);
  
  try {
    // Step 1: Check current pool state
    console.log('\n1️⃣ Checking pool state...');
    const poolInfo = await hook.getPoolInfo(poolKey);
    console.log('Current liquidity:', poolInfo.liquidity.toString());
    
    if (!poolInfo.liquidity.eq(0)) {
      console.log('Pool already has liquidity!');
      console.log('Reserve0:', poolInfo.r0.toString());
      console.log('Reserve1:', poolInfo.r1.toString());
      console.log('Price0:', poolInfo.price0.toString(), '%');
      console.log('Price1:', poolInfo.price1.toString(), '%');
      return;
    }
    
    // Step 2: Initialize pool
    console.log('\n2️⃣ Initializing pool...');
    const SQRT_PRICE_1_1 = '79228162514264337593543950336';
    
    try {
      const initTx = await poolManager.initialize(poolKey, SQRT_PRICE_1_1, {
        gasLimit: 500000
      });
      console.log('Init tx:', initTx.hash);
      await initTx.wait();
      console.log('Pool initialized ✓');
    } catch (e) {
      console.log('Pool might already be initialized');
    }
    
    // Step 3: Set initial ratio (80/20 for YES/NO)
    console.log('\n3️⃣ Setting initial ratio...');
    const ratio0 = token0 === CONFIG.yesToken ? 80 : 20; // If token0 is YES, it gets 80%
    
    try {
      const ratioTx = await hook.setInitialRatio(poolKey, ratio0, {
        gasLimit: 100000
      });
      console.log('Ratio tx:', ratioTx.hash);
      await ratioTx.wait();
      console.log(`Initial ratio set: Token0=${ratio0}%, Token1=${100-ratio0}%`);
    } catch (e) {
      console.log('Ratio might already be set');
    }
    
    // Step 4: Check balances
    console.log('\n4️⃣ Checking token balances...');
    const [yesBalance, noBalance] = await Promise.all([
      yesToken.balanceOf(wallet.address),
      noToken.balanceOf(wallet.address)
    ]);
    
    console.log('YES balance:', yesBalance.toString(), 'wei');
    console.log('NO balance:', noBalance.toString(), 'wei');
    
    // Step 5: Approve tokens
    console.log('\n5️⃣ Approving tokens...');
    
    const [yesAllowance, noAllowance] = await Promise.all([
      yesToken.allowance(wallet.address, CONFIG.hookAddress),
      noToken.allowance(wallet.address, CONFIG.hookAddress)
    ]);
    
    if (yesAllowance.lt(yesBalance)) {
      const approveTx = await yesToken.approve(CONFIG.hookAddress, ethers.constants.MaxUint256);
      console.log('YES approve tx:', approveTx.hash);
      await approveTx.wait();
    }
    
    if (noAllowance.lt(noBalance)) {
      const approveTx = await noToken.approve(CONFIG.hookAddress, ethers.constants.MaxUint256);
      console.log('NO approve tx:', approveTx.hash);
      await approveTx.wait();
    }
    
    console.log('Tokens approved ✓');
    
    // Step 6: Add available liquidity
    console.log('\n6️⃣ Adding available liquidity...');
    console.log('Using whatever tokens we have...');
    
    const addLiqTx = await hook.addAvailableLiquidity(poolKey, {
      gasLimit: 1000000
    });
    
    console.log('Add liquidity tx:', addLiqTx.hash);
    console.log('View on Polygonscan: https://polygonscan.com/tx/' + addLiqTx.hash);
    
    const receipt = await addLiqTx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    
    // Step 7: Verify final state
    console.log('\n7️⃣ Verifying pool state...');
    const finalInfo = await hook.getPoolInfo(poolKey);
    
    console.log('\n✅ Success! Pool setup complete:');
    console.log('Total liquidity:', finalInfo.liquidity.toString(), 'wei');
    console.log('Reserve0:', finalInfo.r0.toString(), 'wei');
    console.log('Reserve1:', finalInfo.r1.toString(), 'wei');
    
    if (finalInfo.liquidity.gt(0)) {
      console.log('\n📈 Market Prices:');
      console.log(`Token0 (${token0 === CONFIG.yesToken ? 'YES' : 'NO'}): ${finalInfo.price0.toString()}%`);
      console.log(`Token1 (${token1 === CONFIG.yesToken ? 'YES' : 'NO'}): ${finalInfo.price1.toString()}%`);
    }
    
    console.log('\n🎉 FlexiblePredictionHook is ready for swaps!');
    console.log('Hook address:', CONFIG.hookAddress);
    
  } catch (error) {
    console.error('\nError:', error.message);
    if (error.data) console.error('Data:', error.data);
  }
}

main().catch(console.error);