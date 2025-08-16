const { ethers } = require('ethers');
const Safe = require('@safe-global/safe-core-sdk').default;
const EthersAdapter = require('@safe-global/safe-ethers-lib').default;
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const ERC1155_ABI = [
    'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
    'function balanceOf(address account, uint256 id) view returns (uint256)'
];

async function transferWithSafeSDK() {
    // Configuration - UPDATE THESE VALUES
    const SAFE_ADDRESS = ''; // Your Gnosis Safe address
    const TOKEN_CONTRACT = ''; // ERC-1155 token contract
    const TO_ADDRESS = ''; // Destination address
    const TOKEN_ID = ''; // Token ID to transfer
    const AMOUNT = '1'; // Amount to transfer
    
    const RPC_URL = process.env.POLYGON_INFURA || 'https://polygon-rpc.com/';
    const PRIVATE_KEY = '0x' + process.env.PRIVATE_KEY;
    
    try {
        console.log('=== Gnosis Safe Transfer using Safe SDK ===\n');
        
        // Initialize provider and signer
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL, {
            name: 'polygon',
            chainId: 137
        });
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);
        
        console.log('Signer address:', signer.address);
        console.log('Safe address:', SAFE_ADDRESS);
        
        // Check token balance
        const tokenContract = new ethers.Contract(TOKEN_CONTRACT, ERC1155_ABI, provider);
        const balance = await tokenContract.balanceOf(SAFE_ADDRESS, TOKEN_ID);
        console.log('Token balance in Safe:', balance.toString());
        
        if (balance.eq(0)) {
            console.log('No tokens to transfer!');
            return;
        }
        
        // Initialize Safe SDK
        const ethAdapter = new EthersAdapter({
            ethers,
            signerOrProvider: signer
        });
        
        const safeSdk = await Safe.create({
            ethAdapter,
            safeAddress: SAFE_ADDRESS
        });
        
        // Get Safe info
        const owners = await safeSdk.getOwners();
        const threshold = await safeSdk.getThreshold();
        const nonce = await safeSdk.getNonce();
        
        console.log('\n=== Safe Info ===');
        console.log('Owners:', owners);
        console.log('Threshold:', threshold);
        console.log('Current nonce:', nonce);
        
        const isOwner = owners.includes(signer.address);
        console.log('You are an owner:', isOwner);
        
        if (!isOwner) {
            console.log('\n❌ You are not an owner of this Safe');
            return;
        }
        
        // Create the transfer transaction
        const transferData = tokenContract.interface.encodeFunctionData('safeTransferFrom', [
            SAFE_ADDRESS,
            TO_ADDRESS,
            TOKEN_ID,
            AMOUNT,
            '0x'
        ]);
        
        const safeTransaction = await safeSdk.createTransaction({
            safeTransactionData: {
                to: TOKEN_CONTRACT,
                data: transferData,
                value: '0'
            }
        });
        
        console.log('\n=== Transaction Details ===');
        console.log('Transferring', AMOUNT, 'token(s) to:', TO_ADDRESS);
        
        // Sign the transaction
        console.log('\nSigning transaction...');
        const signedTransaction = await safeSdk.signTransaction(safeTransaction);
        const txHash = await safeSdk.getTransactionHash(signedTransaction);
        console.log('Transaction hash:', txHash);
        
        // Execute if threshold is met
        const signatures = Object.keys(signedTransaction.signatures);
        console.log('Signatures collected:', signatures.length, '/', threshold);
        
        if (signatures.length >= threshold) {
            console.log('\n✅ Threshold met, executing transaction...');
            
            const executeTxResponse = await safeSdk.executeTransaction(signedTransaction);
            const receipt = await executeTxResponse.transactionResponse?.wait();
            
            console.log('\n✅ Transfer successful!');
            console.log('Transaction hash:', receipt.transactionHash);
            console.log('Gas used:', receipt.gasUsed.toString());
        } else {
            console.log('\n⚠️ Need more signatures to execute');
            console.log('Share the transaction hash with other owners:', txHash);
        }
        
    } catch (error) {
        console.error('\nError:', error.message);
        if (error.reason) {
            console.error('Reason:', error.reason);
        }
        if (error.code) {
            console.error('Code:', error.code);
        }
    }
}

async function main() {
    if (!process.env.PRIVATE_KEY) {
        console.error('Please set PRIVATE_KEY in .env file');
        process.exit(1);
    }
    
    await transferWithSafeSDK();
}

if (require.main === module) {
    main().catch(console.error);
}