// Execute Swap using Uniswap V4 SDK
import { ethers } from 'ethers';
import { Token, CurrencyAmount, Percent } from '@uniswap/sdk-core';

// Configuration
const CONFIG = {
  chainId: 137,
  rpcUrl: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
  privateKey: process.env.PRIVATE_KEY || '',
  
  // Contract Addresses
  poolManager: '0x67366782805870060151383F4BbFF9daB53e5cD6',
  hookAddress: '0x349810b251D655169fAd188CAC0F70c534130327',
  
  // Tokens
  yesToken: '0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1',
  noToken: '0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5',
  
  fee: 3000,
  tickSpacing: 60
};

// Swap Router ABI (simplified)
const SWAP_ROUTER_ABI = [
  'function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) external payable returns (uint256 amountOut)',
];

// ERC20 ABI
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
];

// Hook ABI for direct swap
const HOOK_ABI = [
  'function swap(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, tuple(bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96) params, bytes hookData) external returns (int256 amount0, int256 amount1)',
];

async function main() {
  // Check for private key
  if (!CONFIG.privateKey) {
    console.log('⚠️  No private key found. Set PRIVATE_KEY in your .env file');
    console.log('This script will run in read-only mode.\n');
    await readOnlyDemo();
    return;
  }
  
  console.log('💱 Uniswap V4 Swap Execution\n');
  
  // Initialize provider and signer
  const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  const wallet = new ethers.Wallet(CONFIG.privateKey, provider);
  
  console.log('👛 Wallet Address:', wallet.address);
  
  // Create token instances
  const yesToken = new Token(CONFIG.chainId, CONFIG.yesToken, 18, 'wPOSI-YES');
  const noToken = new Token(CONFIG.chainId, CONFIG.noToken, 18, 'wPOSI-NO');
  
  // Get token contracts
  const yesContract = new ethers.Contract(CONFIG.yesToken, ERC20_ABI, wallet);
  const noContract = new ethers.Contract(CONFIG.noToken, ERC20_ABI, wallet);
  
  // Check balances
  const [yesBalance, noBalance] = await Promise.all([
    yesContract.balanceOf(wallet.address),
    noContract.balanceOf(wallet.address)
  ]);
  
  console.log('\n📊 Current Balances:');
  console.log('YES:', ethers.formatEther(yesBalance), 'wPOSI-YES');
  console.log('NO:', ethers.formatEther(noBalance), 'wPOSI-NO');
  
  // Example: Swap 0.01 YES for NO
  const amountIn = ethers.parseEther('0.01');
  
  if (yesBalance < amountIn) {
    console.log('\n❌ Insufficient YES balance for swap');
    return;
  }
  
  console.log('\n🔄 Preparing Swap:');
  console.log('Input:', ethers.formatEther(amountIn), 'YES');
  console.log('Output: NO (amount determined by pool)');
  
  // Check and set approval
  console.log('\n✅ Checking Approval...');
  const currentAllowance = await yesContract.allowance(wallet.address, CONFIG.hookAddress);
  
  if (currentAllowance < amountIn) {
    console.log('Setting approval for hook...');
    const approveTx = await yesContract.approve(CONFIG.hookAddress, ethers.MaxUint256);
    console.log('Approval tx:', approveTx.hash);
    await approveTx.wait();
    console.log('Approval confirmed!');
  } else {
    console.log('Sufficient allowance already set');
  }
  
  // Prepare swap through hook
  console.log('\n🚀 Executing Swap...');
  
  const hook = new ethers.Contract(CONFIG.hookAddress, HOOK_ABI, wallet);
  
  // Create pool key
  const [token0, token1] = yesToken.sortsBefore(noToken) 
    ? [CONFIG.yesToken, CONFIG.noToken] 
    : [CONFIG.noToken, CONFIG.yesToken];
  
  const poolKey = {
    currency0: token0,
    currency1: token1,
    fee: CONFIG.fee,
    tickSpacing: CONFIG.tickSpacing,
    hooks: CONFIG.hookAddress
  };
  
  // Determine swap direction
  const zeroForOne = CONFIG.yesToken.toLowerCase() === token0.toLowerCase();
  
  const swapParams = {
    zeroForOne: zeroForOne,
    amountSpecified: amountIn,
    sqrtPriceLimitX96: 0 // No price limit
  };
  
  try {
    console.log('Sending swap transaction...');
    const swapTx = await hook.swap(poolKey, swapParams, '0x');
    console.log('Swap tx:', swapTx.hash);
    
    const receipt = await swapTx.wait();
    console.log('Swap confirmed in block:', receipt.blockNumber);
    
    // Check new balances
    const [newYesBalance, newNoBalance] = await Promise.all([
      yesContract.balanceOf(wallet.address),
      noContract.balanceOf(wallet.address)
    ]);
    
    console.log('\n📊 New Balances:');
    console.log('YES:', ethers.formatEther(newYesBalance), 'wPOSI-YES');
    console.log('NO:', ethers.formatEther(newNoBalance), 'wPOSI-NO');
    
    console.log('\n✅ Swap completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Swap failed:', error.message);
  }
}

async function readOnlyDemo() {
  console.log('📖 Read-Only Demo Mode\n');
  
  const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  
  // Create token instances
  const yesToken = new Token(CONFIG.chainId, CONFIG.yesToken, 18, 'wPOSI-YES');
  const noToken = new Token(CONFIG.chainId, CONFIG.noToken, 18, 'wPOSI-NO');
  
  console.log('📊 Pool Information:');
  console.log('Hook Address:', CONFIG.hookAddress);
  console.log('YES Token:', yesToken.address);
  console.log('NO Token:', noToken.address);
  console.log('Fee Tier:', CONFIG.fee / 10000, '%');
  
  console.log('\n📝 To execute a swap:');
  console.log('1. Set PRIVATE_KEY in your .env file');
  console.log('2. Ensure you have YES or NO tokens');
  console.log('3. Run this script again');
  
  console.log('\n💡 Example .env configuration:');
  console.log('PRIVATE_KEY=your_private_key_here');
  console.log('POLYGON_RPC=https://polygon-rpc.com');
}

// Run the script
main().catch(console.error);