/**
 * Wrap your ERC-1155 tokens into ERC-20 tokens
 * Ready to run with your actual addresses!
 */

const { Web3 } = require('../1155_converter/1155-to-20-master/node_modules/web3');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../1155_converter/1155-to-20-master/.env') });

// CONFIGURATION - These are your actual addresses
const FACTORY_ADDRESS = '0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1'; // Your deployed factory
const ERC1155_CONTRACT = '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045'; // Your ERC-1155 (from transfer)
const YOUR_WALLET = '0x884F5C47fA1eCaF0C8957611f648Fb320551ab51'; // Your wallet

// Token wrapping configuration
const CONFIG = {
    TOKEN_ID: 369734907073035612687620714130958374814780831201, // Update this with your actual token ID
    AMOUNT: '1', // Amount to wrap (update as needed)
    
    // ERC-20 wrapper metadata
    TOKEN_NAME: 'Wrapped Polygon Position',    
    TOKEN_SYMBOL: 'wPOSI',           
    TOKEN_DECIMALS: 18              
};

// Helper to encode metadata
function encodeTokenMetadata(web3, name, symbol, decimals) {
    const nameHex = web3.utils.utf8ToHex(name);
    const namePadded = web3.utils.padRight(nameHex, 64);
    const symbolHex = web3.utils.utf8ToHex(symbol);
    const symbolPadded = web3.utils.padRight(symbolHex, 64);
    const decimalsHex = web3.utils.numberToHex(decimals).slice(2).padStart(2, '0');
    return '0x' + namePadded.slice(2) + symbolPadded.slice(2) + decimalsHex;
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
    console.log('Your Address:', userAddress);
    console.log('Factory Address:', FACTORY_ADDRESS);
    console.log('ERC-1155 Contract:', ERC1155_CONTRACT);
    console.log('Token ID:', CONFIG.TOKEN_ID);
    console.log('Amount:', CONFIG.AMOUNT);
    console.log('');
    console.log('ERC-20 Wrapper Details:');
    console.log('  Name:', CONFIG.TOKEN_NAME);
    console.log('  Symbol:', CONFIG.TOKEN_SYMBOL);
    console.log('  Decimals:', CONFIG.TOKEN_DECIMALS);
    
    // Encode metadata
    const metadata = encodeTokenMetadata(web3, CONFIG.TOKEN_NAME, CONFIG.TOKEN_SYMBOL, CONFIG.TOKEN_DECIMALS);
    console.log('\nEncoded Metadata:', metadata.slice(0, 50) + '...');
    
    // Load factory contract
    const factoryABI = require('../1155_converter/1155-to-20-master/build/contracts/Wrapped1155Factory.json').abi;
    const factory = new web3.eth.Contract(factoryABI, FACTORY_ADDRESS);
    
    // Get wrapper address
    const wrapperAddress = await factory.methods.getWrapped1155(
        ERC1155_CONTRACT,
        CONFIG.TOKEN_ID,
        metadata
    ).call();
    
    console.log('\n📍 Wrapper ERC-20 Address:', wrapperAddress);
    
    // Check if wrapper exists
    const code = await web3.eth.getCode(wrapperAddress);
    if (code !== '0x') {
        console.log('   ✅ Wrapper already deployed');
    } else {
        console.log('   🆕 New wrapper will be created on first wrap');
    }
    
    // ERC-1155 contract
    const ERC1155_ABI = [
        {
            "inputs": [
                {"name": "from", "type": "address"},
                {"name": "to", "type": "address"},
                {"name": "id", "type": "uint256"},
                {"name": "amount", "type": "uint256"},
                {"name": "data", "type": "bytes"}
            ],
            "name": "safeTransferFrom",
            "outputs": [],
            "type": "function"
        },
        {
            "inputs": [
                {"name": "account", "type": "address"},
                {"name": "id", "type": "uint256"}
            ],
            "name": "balanceOf",
            "outputs": [{"name": "", "type": "uint256"}],
            "type": "function",
            "constant": true
        }
    ];
    
    const erc1155 = new web3.eth.Contract(ERC1155_ABI, ERC1155_CONTRACT);
    
    // Check balance
    console.log('\n📊 Checking your ERC-1155 balance...');
    const balance = await erc1155.methods.balanceOf(userAddress, CONFIG.TOKEN_ID).call();
    console.log(`   Balance of token ${CONFIG.TOKEN_ID}: ${balance}`);
    
    if (Number(balance) < Number(CONFIG.AMOUNT)) {
        console.error('❌ Insufficient balance!');
        console.log(`   You have ${balance} but trying to wrap ${CONFIG.AMOUNT}`);
        return;
    }
    
    console.log('\n🚀 Ready to wrap!');
    console.log('   This will:');
    console.log('   1. Transfer your ERC-1155 to the factory');
    console.log('   2. Factory creates/uses wrapper at:', wrapperAddress);
    console.log('   3. Mint ERC-20 tokens to your wallet');
    
    // Prompt for confirmation
    console.log('\n⚠️  READY TO EXECUTE TRANSACTION');
    console.log('   From:', userAddress);
    console.log('   To:', FACTORY_ADDRESS);
    console.log('   Method: safeTransferFrom');
    console.log('   Token ID:', CONFIG.TOKEN_ID);
    console.log('   Amount:', CONFIG.AMOUNT);
    
    // EXECUTE THE TRANSACTION
    try {
        console.log('\n📤 Estimating gas...');
        const gasEstimate = await erc1155.methods.safeTransferFrom(
            userAddress,
            FACTORY_ADDRESS,
            CONFIG.TOKEN_ID,
            CONFIG.AMOUNT,
            metadata
        ).estimateGas({ from: userAddress });
        
        console.log('   Estimated gas:', gasEstimate);
        
        const gasPrice = await web3.eth.getGasPrice();
        console.log('   Gas price:', web3.utils.fromWei(gasPrice, 'gwei'), 'gwei');
        
        const estimatedCost = BigInt(gasEstimate) * BigInt(gasPrice);
        console.log('   Estimated cost:', web3.utils.fromWei(estimatedCost.toString(), 'ether'), 'MATIC');
        
        console.log('\n📤 Sending transaction...');
        const tx = await erc1155.methods.safeTransferFrom(
            userAddress,
            FACTORY_ADDRESS,
            CONFIG.TOKEN_ID,
            CONFIG.AMOUNT,
            metadata
        ).send({
            from: userAddress,
            gas: Math.floor(Number(gasEstimate) * 1.2),
            gasPrice: gasPrice.toString()
        });
        
        console.log('\n✅ WRAPPING SUCCESSFUL!');
        console.log('═══════════════════════════════════════');
        console.log('Transaction Hash:', tx.transactionHash);
        console.log('Block Number:', tx.blockNumber);
        console.log('Gas Used:', tx.gasUsed);
        
        console.log('\n📊 Your New Token:');
        console.log('   ERC-20 Address:', wrapperAddress);
        console.log('   Name:', CONFIG.TOKEN_NAME);
        console.log('   Symbol:', CONFIG.TOKEN_SYMBOL);
        
        console.log('\n🔗 View on Polygonscan:');
        console.log('   Transaction:', `https://polygonscan.com/tx/${tx.transactionHash}`);
        console.log('   Your ERC-20:', `https://polygonscan.com/address/${wrapperAddress}`);
        
        // Check new balances
        console.log('\n📊 Verifying balances...');
        const newErc1155Balance = await erc1155.methods.balanceOf(userAddress, CONFIG.TOKEN_ID).call();
        console.log('   Remaining ERC-1155:', newErc1155Balance);
        
        // Check ERC-20 balance
        const ERC20_ABI = [
            {
                "inputs": [{"name": "account", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "", "type": "uint256"}],
                "type": "function",
                "constant": true
            }
        ];
        
        const wrapper = new web3.eth.Contract(ERC20_ABI, wrapperAddress);
        const erc20Balance = await wrapper.methods.balanceOf(userAddress).call();
        console.log('   New ERC-20 balance:', web3.utils.fromWei(erc20Balance, 'ether'), CONFIG.TOKEN_SYMBOL);
        
        console.log('\n🎉 SUCCESS! Your ERC-1155 has been wrapped into ERC-20!');
        console.log('   You can now:');
        console.log('   • Trade on DEXes');
        console.log('   • Add liquidity');
        console.log('   • Use in DeFi protocols');
        console.log('   • Unwrap back to ERC-1155 anytime');
        
    } catch (error) {
        console.error('\n❌ Transaction failed!');
        console.error('Error:', error.message);
        
        if (error.message.includes('insufficient funds')) {
            console.error('   You need more MATIC for gas');
        } else if (error.message.includes('execution reverted')) {
            console.error('   Contract rejected the transaction');
            console.error('   Check token ID and balance');
        }
    }
}

// Add command line support for token ID and amount
if (process.argv[2]) {
    CONFIG.TOKEN_ID = process.argv[2];
    console.log('Using token ID from command line:', CONFIG.TOKEN_ID);
}
if (process.argv[3]) {
    CONFIG.AMOUNT = process.argv[3];
    console.log('Using amount from command line:', CONFIG.AMOUNT);
}

// Run
console.log('🚀 Starting ERC-1155 to ERC-20 Wrapper');
console.log('=====================================\n');
wrapTokens().catch(console.error);