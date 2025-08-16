/**
 * Wrap ERC-1155 with CUSTOM name and symbol
 * 
 * Usage:
 *   node wrap-custom.js
 *   (Interactive prompts will guide you)
 * 
 * Or with arguments:
 *   node wrap-custom.js "Token Name" "SYMBOL" tokenId amount
 */

const { Web3 } = require('web3');
const readline = require('readline');
require('dotenv').config();

const FACTORY_ADDRESS = '0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1';
const ERC1155_CONTRACT = '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045';
const YOUR_WALLET = '0x884F5C47fA1eCaF0C8957611f648Fb320551ab51';

// Your token from Polymarket
const DEFAULT_TOKEN_ID = '106277356443369138797049499065953438334187241175412976556484145976288075138631';

// Helper to encode metadata
function encodeTokenMetadata(web3, name, symbol, decimals = 18) {
    // Ensure name and symbol fit in 32 bytes
    if (name.length > 32) {
        console.log('⚠️  Name truncated to 32 characters');
        name = name.substring(0, 32);
    }
    if (symbol.length > 32) {
        console.log('⚠️  Symbol truncated to 32 characters');
        symbol = symbol.substring(0, 32);
    }
    
    const nameHex = web3.utils.utf8ToHex(name);
    const namePadded = web3.utils.padRight(nameHex, 64);
    const symbolHex = web3.utils.utf8ToHex(symbol);
    const symbolPadded = web3.utils.padRight(symbolHex, 64);
    const decimalsHex = web3.utils.numberToHex(decimals).slice(2).padStart(2, '0');
    return '0x' + namePadded.slice(2) + symbolPadded.slice(2) + decimalsHex;
}

async function promptUser() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    const question = (prompt) => new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
    
    console.log('\n🎨 Custom ERC-20 Wrapper Creator');
    console.log('=================================\n');
    
    // Show suggestions
    console.log('📋 Suggestions based on your Polymarket token:');
    console.log('   • For YES: Name="Polymarket YES", Symbol="pmYES"');
    console.log('   • For NO: Name="Polymarket NO", Symbol="pmNO"');
    console.log('   • Specific: Name="Trump Win YES", Symbol="TRUMP-Y"');
    console.log('   • Generic: Name="PM Position 138631", Symbol="PM-631"');
    console.log('');
    
    const name = await question('Enter token NAME (max 32 chars): ');
    const symbol = await question('Enter token SYMBOL (max 32 chars): ');
    
    const useDefaultToken = await question(`Use default token ID? (y/n) [${DEFAULT_TOKEN_ID.slice(-8)}...]: `);
    let tokenId = DEFAULT_TOKEN_ID;
    if (useDefaultToken.toLowerCase() !== 'y') {
        tokenId = await question('Enter token ID: ');
    }
    
    const amount = await question('Enter amount to wrap (default: all): ') || 'all';
    
    rl.close();
    
    return { name, symbol, tokenId, amount };
}

async function wrapWithCustomMetadata(name, symbol, tokenId, amount) {
    const privateKey = process.env.PRIVATE_KEY;
    const apiKey = process.env.METAMASK_API_KEY;
    
    if (!privateKey || !apiKey) {
        console.error('❌ Missing PRIVATE_KEY or METAMASK_API_KEY in .env');
        return;
    }
    
    const web3 = new Web3(`https://polygon-mainnet.infura.io/v3/${apiKey}`);
    
    // Add account
    const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey.replace('0x', ''));
    web3.eth.accounts.wallet.add(account);
    const userAddress = account.address;
    
    console.log('\n🎁 Creating Custom Wrapped Token');
    console.log('==================================');
    console.log('Name:', name);
    console.log('Symbol:', symbol);
    console.log('Token ID:', tokenId);
    console.log('');
    
    // Check balance first
    const balanceABI = [{
        "inputs": [
            {"name": "account", "type": "address"},
            {"name": "id", "type": "uint256"}
        ],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    }];
    
    const erc1155 = new web3.eth.Contract(balanceABI, ERC1155_CONTRACT);
    const currentBalance = await erc1155.methods.balanceOf(userAddress, tokenId).call();
    
    console.log('Your balance:', currentBalance);
    
    if (currentBalance === '0') {
        console.error('❌ You don\'t have any of this token!');
        
        // Check if you have the wrapped version
        console.log('\n🔍 Checking if you already wrapped with different metadata...');
        const factoryABI = require('./build/contracts/Wrapped1155Factory.json').abi;
        const factory = new web3.eth.Contract(factoryABI, FACTORY_ADDRESS);
        
        // Check with common metadata
        const commonMetadata = [
            { name: 'Wrapped Polygon Position', symbol: 'wPOSI' },
            { name: 'Polymarket YES', symbol: 'pmYES' },
            { name: 'Polymarket NO', symbol: 'pmNO' }
        ];
        
        for (const meta of commonMetadata) {
            const metadata = encodeTokenMetadata(web3, meta.name, meta.symbol, 18);
            const wrapperAddress = await factory.methods.getWrapped1155(
                ERC1155_CONTRACT,
                tokenId,
                metadata
            ).call();
            
            const code = await web3.eth.getCode(wrapperAddress);
            if (code !== '0x') {
                console.log(`   Found wrapper: ${meta.symbol} at ${wrapperAddress}`);
                
                // Check balance
                const erc20ABI = [{
                    "inputs": [{"name": "account", "type": "address"}],
                    "name": "balanceOf",
                    "outputs": [{"name": "", "type": "uint256"}],
                    "type": "function"
                }];
                
                const wrapper = new web3.eth.Contract(erc20ABI, wrapperAddress);
                const wrapperBalance = await wrapper.methods.balanceOf(userAddress).call();
                if (wrapperBalance > 0) {
                    console.log(`   ✅ You have ${web3.utils.fromWei(wrapperBalance, 'ether')} ${meta.symbol}`);
                    console.log('\n💡 To unwrap first, use unwrap-tokens.js');
                }
            }
        }
        return;
    }
    
    // Determine amount
    if (amount === 'all') {
        amount = currentBalance;
    }
    
    if (BigInt(amount) > BigInt(currentBalance)) {
        console.error(`❌ Insufficient balance. You have ${currentBalance} but trying to wrap ${amount}`);
        return;
    }
    
    // Encode metadata
    const metadata = encodeTokenMetadata(web3, name, symbol, 18);
    console.log('\nEncoded Metadata:', metadata.slice(0, 50) + '...');
    
    // Get wrapper address
    const factoryABI = require('./build/contracts/Wrapped1155Factory.json').abi;
    const factory = new web3.eth.Contract(factoryABI, FACTORY_ADDRESS);
    
    const wrapperAddress = await factory.methods.getWrapped1155(
        ERC1155_CONTRACT,
        tokenId,
        metadata
    ).call();
    
    console.log('📍 Wrapper Address:', wrapperAddress);
    
    // Check if this wrapper already exists
    const code = await web3.eth.getCode(wrapperAddress);
    if (code !== '0x') {
        console.log('   ⚠️  This wrapper already exists!');
        
        // Check if user already has balance
        const erc20ABI = [{
            "inputs": [{"name": "account", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "", "type": "uint256"}],
            "type": "function"
        }];
        
        const wrapper = new web3.eth.Contract(erc20ABI, wrapperAddress);
        const existingBalance = await wrapper.methods.balanceOf(userAddress).call();
        if (existingBalance > 0) {
            console.log(`   You already have: ${web3.utils.fromWei(existingBalance, 'ether')} ${symbol}`);
        }
    } else {
        console.log('   🆕 New wrapper will be created');
    }
    
    console.log('\n📋 Summary:');
    console.log('   Wrapping:', amount, 'tokens');
    console.log('   From:', ERC1155_CONTRACT);
    console.log('   To create:', symbol, 'tokens at', wrapperAddress);
    
    const confirm = await new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('\n🚀 Proceed with wrapping? (y/n): ', (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y');
        });
    });
    
    if (!confirm) {
        console.log('❌ Cancelled');
        return;
    }
    
    // Execute wrap
    try {
        // Need full ABI for transfer
        const transferABI = [{
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
        }];
        
        const erc1155Full = new web3.eth.Contract(transferABI, ERC1155_CONTRACT);
        
        console.log('\n📤 Sending transaction...');
        
        const gasEstimate = await erc1155Full.methods.safeTransferFrom(
            userAddress,
            FACTORY_ADDRESS,
            tokenId,
            amount.toString(),
            metadata
        ).estimateGas({ from: userAddress });
        
        const gasPrice = await web3.eth.getGasPrice();
        
        const tx = await erc1155Full.methods.safeTransferFrom(
            userAddress,
            FACTORY_ADDRESS,
            tokenId,
            amount.toString(),
            metadata
        ).send({
            from: userAddress,
            gas: Math.floor(Number(gasEstimate) * 1.2),
            gasPrice: gasPrice.toString()
        });
        
        console.log('\n✅ SUCCESS!');
        console.log('==================================');
        console.log('Transaction:', tx.transactionHash);
        console.log('Wrapped Token:', wrapperAddress);
        console.log('Name:', name);
        console.log('Symbol:', symbol);
        console.log('Amount:', web3.utils.fromWei(amount.toString(), 'ether'), symbol);
        console.log('\n🔗 View on Polygonscan:');
        console.log(`https://polygonscan.com/tx/${tx.transactionHash}`);
        console.log(`https://polygonscan.com/address/${wrapperAddress}`);
        
        console.log('\n📱 Add to MetaMask:');
        console.log('   Contract:', wrapperAddress);
        console.log('   Symbol:', symbol);
        console.log('   Decimals: 18');
        
    } catch (error) {
        console.error('\n❌ Transaction failed:', error.message);
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length >= 2) {
        // Command line arguments provided
        const name = args[0];
        const symbol = args[1];
        const tokenId = args[2] || DEFAULT_TOKEN_ID;
        const amount = args[3] || 'all';
        
        await wrapWithCustomMetadata(name, symbol, tokenId, amount);
    } else {
        // Interactive mode
        const { name, symbol, tokenId, amount } = await promptUser();
        await wrapWithCustomMetadata(name, symbol, tokenId, amount);
    }
}

main().catch(console.error);