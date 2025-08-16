/**
 * Wrap ERC-1155 tokens into ERC-20 tokens using the Wrapped1155Factory
 */

const { Web3 } = require('web3');
require('dotenv').config();

// Configuration
const FACTORY_ADDRESS = '0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1';
const CONFIG = {
    ERC1155_CONTRACT: '0x...', // TODO: Add your ERC-1155 contract address
    TOKEN_ID: 1, // TODO: Token ID to wrap
    AMOUNT: '100', // TODO: Amount to wrap
    
    // Token metadata for ERC-20 wrapper
    TOKEN_NAME: 'Wrapped Token',    // 32 bytes max
    TOKEN_SYMBOL: 'WRAP',           // 32 bytes max
    TOKEN_DECIMALS: 18              // Usually 18 for ERC-20
};

// Helper function to encode token metadata
function encodeTokenMetadata(name, symbol, decimals) {
    // Pad name to 32 bytes
    const nameHex = web3.utils.utf8ToHex(name);
    const namePadded = web3.utils.padRight(nameHex, 64);
    
    // Pad symbol to 32 bytes
    const symbolHex = web3.utils.utf8ToHex(symbol);
    const symbolPadded = web3.utils.padRight(symbolHex, 64);
    
    // Decimals as 1 byte
    const decimalsHex = web3.utils.numberToHex(decimals).slice(2).padStart(2, '0');
    
    // Combine: name (32 bytes) + symbol (32 bytes) + decimals (1 byte) = 65 bytes
    return '0x' + namePadded.slice(2) + symbolPadded.slice(2) + decimalsHex;
}

// Calculate deterministic wrapper address
function calculateWrapperAddress(web3, factoryAddress, multiToken, tokenId, metadata) {
    const factoryABI = require('../1155_converter/1155-to-20-master/build/contracts/Wrapped1155Factory.json').abi;
    const factory = new web3.eth.Contract(factoryABI, factoryAddress);
    
    // This would need the actual calculation logic from the contract
    // For now, return placeholder
    return '0x...'; // The contract's getWrapped1155() method will give us this
}

async function wrapTokens() {
    const privateKey = process.env.PRIVATE_KEY;
    const apiKey = process.env.METAMASK_API_KEY;
    
    if (!privateKey || !apiKey) {
        console.error('❌ Missing PRIVATE_KEY or METAMASK_API_KEY in .env');
        return;
    }
    
    // Connect to Polygon
    const web3 = new Web3(`https://polygon-mainnet.infura.io/v3/${apiKey}`);
    
    // Add account
    const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey.replace('0x', ''));
    web3.eth.accounts.wallet.add(account);
    const userAddress = account.address;
    
    console.log('🎁 Wrapping ERC-1155 to ERC-20');
    console.log('================================');
    console.log('User Address:', userAddress);
    console.log('Factory Address:', FACTORY_ADDRESS);
    console.log('ERC-1155 Contract:', CONFIG.ERC1155_CONTRACT);
    console.log('Token ID:', CONFIG.TOKEN_ID);
    console.log('Amount:', CONFIG.AMOUNT);
    console.log('');
    console.log('ERC-20 Wrapper Details:');
    console.log('  Name:', CONFIG.TOKEN_NAME);
    console.log('  Symbol:', CONFIG.TOKEN_SYMBOL);
    console.log('  Decimals:', CONFIG.TOKEN_DECIMALS);
    
    // Encode metadata
    const metadata = encodeTokenMetadata(
        CONFIG.TOKEN_NAME,
        CONFIG.TOKEN_SYMBOL,
        CONFIG.TOKEN_DECIMALS
    );
    console.log('\nEncoded Metadata:', metadata);
    console.log('  (65 bytes total)');
    
    // Load contracts
    const factoryABI = require('../1155_converter/1155-to-20-master/build/contracts/Wrapped1155Factory.json').abi;
    const factory = new web3.eth.Contract(factoryABI, FACTORY_ADDRESS);
    
    // Get the wrapper address that will be created/used
    try {
        const wrapperAddress = await factory.methods.getWrapped1155(
            CONFIG.ERC1155_CONTRACT,
            CONFIG.TOKEN_ID,
            metadata
        ).call();
        
        console.log('\n📍 Wrapper ERC-20 Address:', wrapperAddress);
        
        // Check if wrapper already exists
        const code = await web3.eth.getCode(wrapperAddress);
        if (code !== '0x') {
            console.log('   ✅ Wrapper already deployed');
        } else {
            console.log('   🆕 New wrapper will be created');
        }
    } catch (error) {
        console.error('Error getting wrapper address:', error.message);
    }
    
    // ERC-1155 ABI for safeTransferFrom
    const ERC1155_ABI = [
        {
            "inputs": [
                {"internalType": "address", "name": "from", "type": "address"},
                {"internalType": "address", "name": "to", "type": "address"},
                {"internalType": "uint256", "name": "id", "type": "uint256"},
                {"internalType": "uint256", "name": "amount", "type": "uint256"},
                {"internalType": "bytes", "name": "data", "type": "bytes"}
            ],
            "name": "safeTransferFrom",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "address", "name": "account", "type": "address"},
                {"internalType": "uint256", "name": "id", "type": "uint256"}
            ],
            "name": "balanceOf",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "address", "name": "operator", "type": "address"},
                {"internalType": "bool", "name": "approved", "type": "bool"}
            ],
            "name": "setApprovalForAll",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];
    
    const erc1155 = new web3.eth.Contract(ERC1155_ABI, CONFIG.ERC1155_CONTRACT);
    
    // Check balance
    console.log('\n📊 Checking balances...');
    const balance = await erc1155.methods.balanceOf(userAddress, CONFIG.TOKEN_ID).call();
    console.log(`   Your balance of token ${CONFIG.TOKEN_ID}: ${balance}`);
    
    if (Number(balance) < Number(CONFIG.AMOUNT)) {
        console.error('❌ Insufficient balance!');
        return;
    }
    
    // The wrapping happens by sending the ERC-1155 to the factory
    // The factory's onERC1155Received hook will mint the ERC-20 tokens
    
    console.log('\n🚀 Ready to wrap tokens!');
    console.log('   This will:');
    console.log('   1. Send your ERC-1155 tokens to the factory');
    console.log('   2. Factory creates/uses wrapper contract');
    console.log('   3. Mints equivalent ERC-20 tokens to you');
    
    console.log('\n📝 Transaction to execute:');
    console.log('   Method: safeTransferFrom');
    console.log('   From:', userAddress);
    console.log('   To:', FACTORY_ADDRESS);
    console.log('   Token ID:', CONFIG.TOKEN_ID);
    console.log('   Amount:', CONFIG.AMOUNT);
    console.log('   Data:', metadata);
    
    // Uncomment to execute:
    /*
    try {
        const gasEstimate = await erc1155.methods.safeTransferFrom(
            userAddress,
            FACTORY_ADDRESS,
            CONFIG.TOKEN_ID,
            CONFIG.AMOUNT,
            metadata
        ).estimateGas({ from: userAddress });
        
        console.log('\n⛽ Estimated gas:', gasEstimate);
        
        const gasPrice = await web3.eth.getGasPrice();
        console.log('   Gas price:', web3.utils.fromWei(gasPrice, 'gwei'), 'gwei');
        
        const tx = await erc1155.methods.safeTransferFrom(
            userAddress,
            FACTORY_ADDRESS,
            CONFIG.TOKEN_ID,
            CONFIG.AMOUNT,
            metadata
        ).send({
            from: userAddress,
            gas: Math.floor(gasEstimate * 1.2),
            gasPrice: gasPrice
        });
        
        console.log('\n✅ Wrapping successful!');
        console.log('   Transaction:', tx.transactionHash);
        console.log('   View on Polygonscan:');
        console.log(`   https://polygonscan.com/tx/${tx.transactionHash}`);
        
    } catch (error) {
        console.error('\n❌ Transaction failed:', error.message);
    }
    */
    
    console.log('\n⚠️  Transaction is ready but commented out for safety.');
    console.log('   Uncomment the transaction code to execute.');
}

// Run
wrapTokens().catch(console.error);