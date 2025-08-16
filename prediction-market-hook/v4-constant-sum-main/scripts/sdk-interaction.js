// Uniswap V4 SDK Interaction Script for Prediction Market Hook
import { ethers } from 'ethers';
import { 
  Pool,
  PoolKey,
  Currency,
  PoolManager,
  Hook,
  encodeRouteToPath,
  SwapRouter
} from '@uniswap/v4-sdk';
import { Token, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core';

// Configuration
const CONFIG = {
  // Polygon Mainnet
  chainId: 137,
  rpcUrl: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
  
  // Contract Addresses
  poolManager: '0x67366782805870060151383F4BbFF9daB53e5cD6',
  hookAddress: '0x349810b251D655169fAd188CAC0F70c534130327', // Our deployed hook
  
  // Token Addresses (Wrapped Polymarket positions)
  yesToken: '0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1', // wPOSI-YES
  noToken: '0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5',   // wPOSI-NO
  
  // Pool Configuration
  fee: 3000,
  tickSpacing: 60
};

// Initialize provider and signer
const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);

async function main() {
  console.log('🚀 Uniswap V4 SDK - Prediction Market Hook Interaction\n');
  
  // Create Token instances
  const yesToken = new Token(
    CONFIG.chainId,
    CONFIG.yesToken,
    18,
    'wPOSI-YES',
    'Wrapped YES Position'
  );
  
  const noToken = new Token(
    CONFIG.chainId,
    CONFIG.noToken,
    18,
    'wPOSI-NO',
    'Wrapped NO Position'
  );
  
  console.log('📊 Market: "Will Google have the best AI model by September 2025?"\n');
  console.log('✅ YES Token:', yesToken.address);
  console.log('❌ NO Token:', noToken.address);
  console.log('🪝 Hook Address:', CONFIG.hookAddress);
  console.log('🏊 Pool Manager:', CONFIG.poolManager);
  
  // Order tokens properly (token0 < token1)
  const [token0, token1] = yesToken.sortsBefore(noToken) 
    ? [yesToken, noToken] 
    : [noToken, yesToken];
  
  console.log('\n📋 Pool Configuration:');
  console.log('Token0:', token0.symbol, '(' + token0.address + ')');
  console.log('Token1:', token1.symbol, '(' + token1.address + ')');
  console.log('Fee:', CONFIG.fee / 10000, '%');
  console.log('Tick Spacing:', CONFIG.tickSpacing);
  
  // Create PoolKey
  const poolKey = {
    currency0: token0.address,
    currency1: token1.address,
    fee: CONFIG.fee,
    tickSpacing: CONFIG.tickSpacing,
    hooks: CONFIG.hookAddress
  };
  
  console.log('\n🔑 Pool Key:', poolKey);
  
  // Example: Create swap parameters
  console.log('\n💱 Example Swap Parameters:');
  
  // Swap 0.1 YES for NO
  const amountIn = CurrencyAmount.fromRawAmount(yesToken, ethers.parseEther('0.1').toString());
  
  console.log('Input:', amountIn.toSignificant(6), yesToken.symbol);
  console.log('Output: ? NO tokens (determined by constant-sum AMM)');
  
  // Calculate expected output (constant sum: x + y = k)
  // With 80/20 initial ratio and constant sum
  const expectedOutput = calculateConstantSumOutput(
    0.1,  // input amount
    1.6,  // YES reserve (80% of 2 tokens)
    0.4,  // NO reserve (20% of 2 tokens)
    true  // swapping YES for NO
  );
  
  console.log('Expected Output (approx):', expectedOutput.toFixed(6), 'NO tokens');
  console.log('\n📈 Price Impact: Swapping moves the market price');
  console.log('   Before: YES=80%, NO=20%');
  console.log('   After: Price adjusts based on constant-sum formula');
  
  // Example: Quote a swap using the SDK
  console.log('\n🔍 SDK Quote Example:');
  console.log('To get an actual quote, you would:');
  console.log('1. Create a Pool instance with current state');
  console.log('2. Use Pool.getOutputAmount() for quotes');
  console.log('3. Build a SwapRouter transaction');
  
  // Show how to monitor the pool
  console.log('\n👀 Monitoring Pool State:');
  console.log('You can monitor:');
  console.log('- Current reserves');
  console.log('- Price ratio (YES/NO)');
  console.log('- Total liquidity');
  console.log('- Recent swaps');
  
  // Example of building a swap transaction (not executing)
  console.log('\n🛠️ Building Swap Transaction (example):');
  const swapParams = {
    tokenIn: yesToken.address,
    tokenOut: noToken.address,
    fee: CONFIG.fee,
    recipient: '0xYourAddress',
    deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes
    amountIn: amountIn.quotient.toString(),
    amountOutMinimum: 0, // Set slippage protection in production
    sqrtPriceLimitX96: 0
  };
  
  console.log('Swap Parameters:', JSON.stringify(swapParams, null, 2));
  
  console.log('\n✨ SDK Integration Complete!');
  console.log('This script demonstrates how to use the V4 SDK with our prediction market hook.');
  console.log('\nNext steps:');
  console.log('1. Connect a wallet to execute swaps');
  console.log('2. Implement actual quote fetching from chain');
  console.log('3. Add slippage protection');
  console.log('4. Build a UI using these SDK functions');
}

// Helper function to calculate output for constant-sum AMM
function calculateConstantSumOutput(inputAmount, reserveIn, reserveOut, isYesForNo) {
  // Constant sum formula: x + y = k
  // When swapping, we maintain the sum constant
  const k = reserveIn + reserveOut;
  
  // New reserves after swap
  const newReserveIn = reserveIn + inputAmount;
  const newReserveOut = k - newReserveIn;
  
  // Output amount is the difference in the out reserve
  const outputAmount = reserveOut - newReserveOut;
  
  return outputAmount;
}

// Run the script
main().catch(console.error);