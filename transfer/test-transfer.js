const ERC1155Transfer = require('./transfer-1155.js');
const path = require('path');
// Load local .env first, then fallback to 1155_converter .env
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
if (!process.env.PRIVATE_KEY) {
    require('dotenv').config({ path: path.resolve(__dirname, '../1155_converter/1155-to-20-master/.env') });
}

async function testTransfer() {
    // Configuration - UPDATE THESE VALUES
    const TOKEN_CONTRACT = ''; // ERC-1155 token contract address
    const FROM_ADDRESS = '';   // Source wallet (proxy wallet)
    const TO_ADDRESS = '';     // Destination wallet
    const TOKEN_ID = '';       // Token ID to transfer
    const AMOUNT = '1';        // Amount to transfer
    
    console.log('=== ERC-1155 Transfer Test ===');
    console.log('Token Contract:', TOKEN_CONTRACT);
    console.log('From:', FROM_ADDRESS);
    console.log('To:', TO_ADDRESS);
    console.log('Token ID:', TOKEN_ID);
    console.log('Amount:', AMOUNT);
    console.log('=============================\n');
    
    const RPC_URL = process.env.POLYGON_INFURA || 'https://polygon-rpc.com/';
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    
    if (!PRIVATE_KEY) {
        console.error('Private key not found in .env file');
        process.exit(1);
    }
    
    if (!TOKEN_CONTRACT || !FROM_ADDRESS || !TO_ADDRESS || !TOKEN_ID) {
        console.error('Please fill in all the required values in this file');
        process.exit(1);
    }
    
    try {
        const transfer = new ERC1155Transfer(RPC_URL, PRIVATE_KEY);
        
        // Step 1: Check initial balance
        console.log('Checking initial balance...');
        const initialBalance = await transfer.checkBalance(TOKEN_CONTRACT, FROM_ADDRESS, TOKEN_ID);
        
        if (parseInt(initialBalance) === 0) {
            console.log('No tokens to transfer. Balance is 0.');
            return;
        }
        
        // Step 2: Execute transfer
        console.log(`\nExecuting transfer of ${AMOUNT} tokens...`);
        const receipt = await transfer.transferSingle(
            TOKEN_CONTRACT,
            FROM_ADDRESS,
            TO_ADDRESS,
            TOKEN_ID,
            AMOUNT
        );
        
        // Step 3: Verify balances after transfer
        console.log('\nVerifying balances after transfer...');
        const fromBalance = await transfer.checkBalance(TOKEN_CONTRACT, FROM_ADDRESS, TOKEN_ID);
        const toBalance = await transfer.checkBalance(TOKEN_CONTRACT, TO_ADDRESS, TOKEN_ID);
        
        console.log('\n=== Transfer Complete ===');
        console.log('Transaction Hash:', receipt.transactionHash);
        console.log('From Address New Balance:', fromBalance);
        console.log('To Address New Balance:', toBalance);
        
    } catch (error) {
        console.error('\nTransfer failed:', error.message);
        
        // Common error handling
        if (error.message.includes('Not approved')) {
            console.log('\nHint: The executing wallet needs approval. Run:');
            console.log(`node transfer-1155.js approve ${TOKEN_CONTRACT} <executingWalletAddress> true`);
        } else if (error.message.includes('Insufficient balance')) {
            console.log('\nHint: The source wallet does not have enough tokens.');
        }
    }
}

// Run the test
testTransfer().catch(console.error);