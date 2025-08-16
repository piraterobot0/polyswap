/**
 * Check ERC-1155 and wrapped ERC-20 balances
 */

const { Web3 } = require('web3');
require('dotenv').config();

// Configuration
const FACTORY_ADDRESS = '0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1';

// Add your tokens here
const TOKENS_TO_CHECK = [
    {
        erc1155Contract: '0x...', // ERC-1155 contract address
        tokenId: 1,
        wrapperName: 'Wrapped Token 1',
        wrapperSymbol: 'WRAP1',
        wrapperDecimals: 18
    },
    // Add more tokens as needed
];

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

async function checkBalances() {
    const apiKey = process.env.METAMASK_API_KEY;
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!apiKey) {
        console.error('❌ Missing METAMASK_API_KEY in .env');
        return;
    }
    
    // Connect to Polygon
    const web3 = new Web3(`https://polygon-mainnet.infura.io/v3/${apiKey}`);
    
    // Get user address
    let userAddress;
    if (privateKey) {
        const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey.replace('0x', ''));
        userAddress = account.address;
    } else {
        // Default to the deployment address if no private key
        userAddress = '0x884F5C47fA1eCaF0C8957611f648Fb320551ab51';
    }
    
    console.log('💰 Token Balance Checker');
    console.log('========================');
    console.log('User Address:', userAddress);
    console.log('Factory Address:', FACTORY_ADDRESS);
    console.log('');
    
    // Load factory contract
    const factoryABI = require('../1155_converter/1155-to-20-master/build/contracts/Wrapped1155Factory.json').abi;
    const factory = new web3.eth.Contract(factoryABI, FACTORY_ADDRESS);
    
    // ERC-1155 ABI
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
            "inputs": [],
            "name": "totalSupply",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "name",
            "outputs": [{"internalType": "string", "name": "", "type": "string"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "symbol",
            "outputs": [{"internalType": "string", "name": "", "type": "string"}],
            "stateMutability": "view",
            "type": "function"
        }
    ];
    
    console.log('📊 Checking balances...\n');
    
    for (const token of TOKENS_TO_CHECK) {
        console.log('─'.repeat(60));
        console.log(`Token ID: ${token.tokenId}`);
        console.log(`ERC-1155 Contract: ${token.erc1155Contract}`);
        
        try {
            // Check ERC-1155 balance
            const erc1155 = new web3.eth.Contract(ERC1155_ABI, token.erc1155Contract);
            const erc1155Balance = await erc1155.methods.balanceOf(userAddress, token.tokenId).call();
            console.log(`ERC-1155 Balance: ${erc1155Balance}`);
            
            // Get wrapper address
            const metadata = encodeTokenMetadata(
                token.wrapperName,
                token.wrapperSymbol,
                token.wrapperDecimals
            );
            
            const wrapperAddress = await factory.methods.getWrapped1155(
                token.erc1155Contract,
                token.tokenId,
                metadata
            ).call();
            
            console.log(`\nWrapper Address: ${wrapperAddress}`);
            
            // Check if wrapper exists
            const code = await web3.eth.getCode(wrapperAddress);
            if (code !== '0x') {
                // Wrapper exists, check ERC-20 balance
                const wrapper = new web3.eth.Contract(ERC20_ABI, wrapperAddress);
                
                const erc20Balance = await wrapper.methods.balanceOf(userAddress).call();
                const totalSupply = await wrapper.methods.totalSupply().call();
                const name = await wrapper.methods.name().call();
                const symbol = await wrapper.methods.symbol().call();
                
                console.log(`Wrapper Status: ✅ Deployed`);
                console.log(`Wrapper Name: ${name}`);
                console.log(`Wrapper Symbol: ${symbol}`);
                console.log(`ERC-20 Balance: ${web3.utils.fromWei(erc20Balance, 'ether')} ${symbol}`);
                console.log(`Total Supply: ${web3.utils.fromWei(totalSupply, 'ether')} ${symbol}`);
                
                // Check factory's ERC-1155 balance (locked tokens)
                const factoryErc1155Balance = await erc1155.methods.balanceOf(
                    FACTORY_ADDRESS,
                    token.tokenId
                ).call();
                console.log(`Locked in Factory: ${factoryErc1155Balance} (ERC-1155)`);
                
            } else {
                console.log(`Wrapper Status: ❌ Not deployed`);
                console.log(`ERC-20 Balance: 0 (wrapper not created)`);
            }
            
        } catch (error) {
            console.error(`Error checking token ${token.tokenId}:`, error.message);
        }
    }
    
    console.log('─'.repeat(60));
    console.log('\n✅ Balance check complete!');
    
    // Summary
    console.log('\n📈 Quick Actions:');
    console.log('   • To wrap tokens: Use wrap-tokens.js');
    console.log('   • To unwrap tokens: Use unwrap-tokens.js');
    console.log('   • Factory contract:', `https://polygonscan.com/address/${FACTORY_ADDRESS}#code`);
}

// Run
checkBalances().catch(console.error);