const Web3 = require('web3');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Polymarket ProxyWallet ABI (only the functions we need)
const PROXY_WALLET_ABI = [
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{"name": "", "type": "address"}],
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "components": [
                    {"name": "to", "type": "address"},
                    {"name": "data", "type": "bytes"}
                ],
                "name": "calls",
                "type": "tuple[]"
            }
        ],
        "name": "proxy",
        "outputs": [{"name": "results", "type": "bytes[]"}],
        "type": "function"
    }
];

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
    }
];

async function checkProxyWalletOwner() {
    const web3 = new Web3(process.env.POLYGON_INFURA || 'https://polygon-rpc.com/');
    const PROXY_WALLET = ''; // Add your proxy wallet address
    
    const proxyContract = new web3.eth.Contract(PROXY_WALLET_ABI, PROXY_WALLET);
    
    try {
        const owner = await proxyContract.methods.owner().call();
        console.log('Proxy Wallet:', PROXY_WALLET);
        console.log('Owner:', owner);
        
        const account = web3.eth.accounts.privateKeyToAccount('0x' + process.env.PRIVATE_KEY);
        console.log('Your wallet:', account.address);
        console.log('You are the owner:', owner.toLowerCase() === account.address.toLowerCase());
        
        return { owner, isOwner: owner.toLowerCase() === account.address.toLowerCase() };
    } catch (error) {
        console.error('Error checking owner:', error.message);
        return null;
    }
}

async function transferViaProxy() {
    const web3 = new Web3(process.env.POLYGON_INFURA || 'https://polygon-rpc.com/');
    
    // Configuration - UPDATE THESE VALUES
    const PROXY_WALLET = ''; // Your proxy wallet address
    const TOKEN_CONTRACT = ''; // ERC-1155 token contract
    const TO_ADDRESS = ''; // Destination address
    const TOKEN_ID = ''; // Token ID to transfer
    const AMOUNT = '1'; // Amount to transfer
    
    const account = web3.eth.accounts.privateKeyToAccount('0x' + process.env.PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);
    
    try {
        // First check ownership
        const ownership = await checkProxyWalletOwner();
        if (!ownership || !ownership.isOwner) {
            console.log('\n❌ You are not the owner of the proxy wallet.');
            console.log('The proxy wallet can only be controlled by its owner.');
            console.log('\nOptions:');
            console.log('1. Contact Polymarket support to transfer tokens from your proxy wallet');
            console.log('2. Use Polymarket\'s interface to withdraw/transfer tokens');
            return;
        }
        
        // Encode the ERC1155 transfer call
        const erc1155Contract = new web3.eth.Contract(ERC1155_ABI, TOKEN_CONTRACT);
        const transferData = erc1155Contract.methods.safeTransferFrom(
            PROXY_WALLET,
            TO_ADDRESS,
            TOKEN_ID,
            AMOUNT,
            '0x'
        ).encodeABI();
        
        // Create the proxy call
        const proxyContract = new web3.eth.Contract(PROXY_WALLET_ABI, PROXY_WALLET);
        const proxyCall = [{
            to: TOKEN_CONTRACT,
            data: transferData
        }];
        
        console.log('\n✅ You own the proxy wallet! Executing transfer...');
        console.log('From (Proxy):', PROXY_WALLET);
        console.log('To:', TO_ADDRESS);
        console.log('Token ID:', TOKEN_ID);
        console.log('Amount:', AMOUNT);
        
        const tx = proxyContract.methods.proxy(proxyCall);
        const gas = await tx.estimateGas({ from: account.address });
        const gasPrice = await web3.eth.getGasPrice();
        
        const receipt = await tx.send({
            from: account.address,
            gas: Math.floor(gas * 1.2),
            gasPrice: gasPrice
        });
        
        console.log('\n✅ Transfer successful!');
        console.log('Transaction hash:', receipt.transactionHash);
        
    } catch (error) {
        console.error('\nError:', error.message);
    }
}

async function main() {
    console.log('=== Polymarket Proxy Wallet Transfer ===\n');
    
    if (!process.env.PRIVATE_KEY) {
        console.error('Please set PRIVATE_KEY in .env file');
        process.exit(1);
    }
    
    await transferViaProxy();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { checkProxyWalletOwner, transferViaProxy };