// Deploy PredictionMarketHookV2 using ethers.js
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Contract bytecode (we'll need to compile first)
const BYTECODE = '0x' + fs.readFileSync(
  path.resolve(__dirname, '../out/PredictionMarketHookV2.sol/PredictionMarketHookV2.bin'),
  'utf8'
).trim();

const ABI = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../out/PredictionMarketHookV2.sol/PredictionMarketHookV2.abi.json'),
  'utf8'
));

async function main() {
  console.log('🚀 Deploying PredictionMarketHookV2\n');
  
  const provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_RPC || 'https://polygon-rpc.com');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log('Deployer:', wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log('Balance:', ethers.utils.formatEther(balance), 'MATIC\n');
  
  // Deploy contract
  const factory = new ethers.ContractFactory(ABI, BYTECODE, wallet);
  
  const poolManager = process.env.POOLMANAGER || '0x67366782805870060151383F4BbFF9daB53e5cD6';
  console.log('Pool Manager:', poolManager);
  console.log('\nDeploying contract...');
  
  const hook = await factory.deploy(poolManager, {
    gasLimit: 3000000,
    gasPrice: ethers.utils.parseUnits('50', 'gwei')
  });
  
  console.log('Transaction:', hook.deployTransaction.hash);
  console.log('Waiting for confirmation...');
  
  await hook.deployed();
  
  console.log('\n=================================');
  console.log('✅ PredictionMarketHookV2 Deployed!');
  console.log('=================================');
  console.log('Address:', hook.address);
  console.log('Transaction:', hook.deployTransaction.hash);
  console.log('Block:', hook.deployTransaction.blockNumber);
  console.log('\nView on Polygonscan:');
  console.log(`https://polygonscan.com/address/${hook.address}`);
  
  // Update .env with new hook address
  const envPath = path.resolve(__dirname, '../.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(
    /HOOK_ADDRESS=.*/,
    `HOOK_ADDRESS=${hook.address}`
  );
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ Updated .env with new hook address');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Run: node scripts/initialize-pool-v2.js');
  console.log('2. Run: node scripts/add-liquidity-v2.js');
}

main().catch(console.error);