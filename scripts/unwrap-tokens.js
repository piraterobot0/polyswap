/**
 * Unwrap ERC-20 tokens back to ERC-1155 tokens
 */

const { Web3 } = require('web3');
require('dotenv').config();

// Configuration
const FACTORY_ADDRESS = '0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1';
const CONFIG = {
    ERC1155_CONTRACT: '0x...', // TODO: Original ERC-1155 contract address
    TOKEN_ID: 1, // TODO: Token ID to unwrap
    AMOUNT: '100', // TODO: Amount to unwrap (in wei for ERC-20)
    
    // Must match the metadata used when wrapping
    TOKEN_NAME: 'Wrapped Token',    
    TOKEN_SYMBOL: 'WRAP',           
    TOKEN_DECIMALS: 18              
};

// Helper to encode metadata
function encodeTokenMetadata(name, symbol, decimals) {
    const web3 = new Web3();
    const nameHex = web3.utils.utf8ToHex(name);
    const namePadded = web3.utils.padRight(nameHex, 64);
    const symbolHex = web3.utils.utf8ToHex(symbol);
    const symbolPadded = web3.utils.padRight(symbolHex, 64);
    const decimalsHex = web3.utils.numberToHex(decimals).slice(2).padStart(2, '0');
    return '0x' + namePadded.slice(2) + symbolPadded.slice(2) + decimalsHex;
}

async function unwrapTokens() {
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
    
    console.log('📦 Unwrapping ERC-20 to ERC-1155');
    console.log('==================================');
    console.log('User Address:', userAddress);
    console.log('Factory Address:', FACTORY_ADDRESS);
    console.log('ERC-1155 Contract:', CONFIG.ERC1155_CONTRACT);
    console.log('Token ID:', CONFIG.TOKEN_ID);
    console.log('Amount to Unwrap:', web3.utils.fromWei(CONFIG.AMOUNT, 'ether'), CONFIG.TOKEN_SYMBOL);
    
    // Encode metadata (must match what was used for wrapping)
    const metadata = encodeTokenMetadata(
        CONFIG.TOKEN_NAME,
        CONFIG.TOKEN_SYMBOL,
        CONFIG.TOKEN_DECIMALS
    );
    
    // Load factory contract
    const factoryABI = require('../1155_converter/1155-to-20-master/build/contracts/Wrapped1155Factory.json').abi;
    const factory = new web3.eth.Contract(factoryABI, FACTORY_ADDRESS);
    
    // Get wrapper address
    const wrapperAddress = await factory.methods.getWrapped1155(
        CONFIG.ERC1155_CONTRACT,
        CONFIG.TOKEN_ID,
        metadata
    ).call();
    
    console.log('\n📍 Wrapper ERC-20 Address:', wrapperAddress);
    
    // Check if wrapper exists
    const code = await web3.eth.getCode(wrapperAddress);
    if (code === '0x') {
        console.error('❌ Wrapper not deployed! No wrapped tokens exist for this configuration.');
        return;
    }
    
    // ERC-20 ABI
    const ERC20_ABI = [
        {
            "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "address", "name": "spender", "type": "address"},
                {"internalType": "uint256", "name": "amount", "type": "uint256"}
            ],
            "name": "approve",
            "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];
    
    const wrapper = new web3.eth.Contract(ERC20_ABI, wrapperAddress);
    
    // Check ERC-20 balance
    console.log('\n📊 Checking balances...');
    const erc20Balance = await wrapper.methods.balanceOf(userAddress).call();
    console.log('   Your ERC-20 balance:', web3.utils.fromWei(erc20Balance, 'ether'), CONFIG.TOKEN_SYMBOL);
    
    if (Number(erc20Balance) < Number(CONFIG.AMOUNT)) {
        console.error('❌ Insufficient ERC-20 balance!');
        return;
    }
    
    // Check factory's ERC-1155 balance
    const ERC1155_ABI = [
        {
            "inputs": [
                {"internalType": "address", "name": "account", "type": "address"},
                {"internalType": "uint256", "name": "id", "type": "uint256"}
            ],
            "name": "balanceOf",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
        }
    ];
    
    const erc1155 = new web3.eth.Contract(ERC1155_ABI, CONFIG.ERC1155_CONTRACT);
    const factoryBalance = await erc1155.methods.balanceOf(FACTORY_ADDRESS, CONFIG.TOKEN_ID).call();
    console.log('   Factory holds:', factoryBalance, 'ERC-1155 tokens');
    
    // The unwrapping process
    console.log('\n🚀 Ready to unwrap tokens!');
    console.log('   This will:');
    console.log('   1. Burn your ERC-20 tokens');
    console.log('   2. Transfer ERC-1155 tokens from factory to you');
    
    console.log('\n📝 Transaction to execute:');
    console.log('   Method: unwrap');
    console.log('   MultiToken:', CONFIG.ERC1155_CONTRACT);
    console.log('   Token ID:', CONFIG.TOKEN_ID);
    console.log('   Amount:', CONFIG.AMOUNT, 'wei');
    console.log('   Recipient:', userAddress);
    console.log('   Data:', metadata);
    
    // Note: The factory's unwrap function will handle burning the ERC-20 tokens
    // No approval needed as the factory calls burn directly
    
    // Uncomment to execute:
    /*
    try {
        const gasEstimate = await factory.methods.unwrap(
            CONFIG.ERC1155_CONTRACT,
            CONFIG.TOKEN_ID,
            CONFIG.AMOUNT,
            userAddress,
            metadata
        ).estimateGas({ from: userAddress });
        
        console.log('\n⛽ Estimated gas:', gasEstimate);
        
        const gasPrice = await web3.eth.getGasPrice();
        console.log('   Gas price:', web3.utils.fromWei(gasPrice, 'gwei'), 'gwei');
        
        const tx = await factory.methods.unwrap(
            CONFIG.ERC1155_CONTRACT,
            CONFIG.TOKEN_ID,
            CONFIG.AMOUNT,
            userAddress,
            metadata
        ).send({
            from: userAddress,
            gas: Math.floor(gasEstimate * 1.2),
            gasPrice: gasPrice
        });
        
        console.log('\n✅ Unwrapping successful!');
        console.log('   Transaction:', tx.transactionHash);
        console.log('   View on Polygonscan:');
        console.log(`   https://polygonscan.com/tx/${tx.transactionHash}`);
        
        // Check new balances
        const newErc20Balance = await wrapper.methods.balanceOf(userAddress).call();
        const newErc1155Balance = await erc1155.methods.balanceOf(userAddress, CONFIG.TOKEN_ID).call();
        
        console.log('\n📊 New balances:');
        console.log('   ERC-20:', web3.utils.fromWei(newErc20Balance, 'ether'), CONFIG.TOKEN_SYMBOL);
        console.log('   ERC-1155:', newErc1155Balance);
        
    } catch (error) {
        console.error('\n❌ Transaction failed:', error.message);
    }
    */
    
    console.log('\n⚠️  Transaction is ready but commented out for safety.');
    console.log('   Uncomment the transaction code to execute.');
}

// Run
unwrapTokens().catch(console.error);