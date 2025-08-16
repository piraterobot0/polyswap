const { ethers } = require('ethers');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Configuration
const CONFIG = {
    FACTORY_ADDRESS: '0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1',
    ERC1155_CONTRACT: '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045',
    YES_TOKEN_ID: '65880048952541620153230365826580171049439578129923156747663728476967119230732',
    TOKEN_NAME: 'Wrapped POSI YES Google AI Sept',
    TOKEN_SYMBOL: 'wPOSI-YES',
    TOKEN_DECIMALS: 18
};

// Helper function to encode metadata
function encodeMetadata(name, symbol, decimals) {
    const nameHex = ethers.utils.formatBytes32String(name);
    const symbolHex = ethers.utils.formatBytes32String(symbol);
    const decimalsHex = ethers.utils.hexlify(decimals).slice(2).padStart(2, '0');
    return nameHex + symbolHex.slice(2) + decimalsHex;
}

async function main() {
    // Check for private key
    if (!process.env.PRIVATE_KEY) {
        console.error('❌ Please set PRIVATE_KEY in your .env file');
        process.exit(1);
    }

    // Connect to Polygon
    const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');
    
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log('Connected wallet:', wallet.address);

    // ERC-1155 ABI
    const erc1155Abi = [
        'function balanceOf(address account, uint256 id) view returns (uint256)',
        'function isApprovedForAll(address account, address operator) view returns (bool)',
        'function setApprovalForAll(address operator, bool approved)',
        'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)'
    ];

    const erc1155 = new ethers.Contract(CONFIG.ERC1155_CONTRACT, erc1155Abi, wallet);

    // Check balance
    console.log('\nChecking YES token balance...');
    const balance = await erc1155.balanceOf(wallet.address, CONFIG.YES_TOKEN_ID);
    console.log('Balance:', balance.toString(), 'units');

    // Calculate wrapper address first
    const factoryAbi = [
        'function getWrapped1155(address multiToken, uint256 tokenId, bytes calldata data) external view returns (address)'
    ];
    
    const factory = new ethers.Contract(CONFIG.FACTORY_ADDRESS, factoryAbi, provider);
    const metadata = encodeMetadata(CONFIG.TOKEN_NAME, CONFIG.TOKEN_SYMBOL, CONFIG.TOKEN_DECIMALS);
    const wrapperAddress = await factory.getWrapped1155(
        CONFIG.ERC1155_CONTRACT,
        CONFIG.YES_TOKEN_ID,
        metadata
    );

    console.log('Wrapper address:', wrapperAddress);

    // Check if already wrapped
    const erc20Abi = [
        'function balanceOf(address account) view returns (uint256)',
        'function name() view returns (string)',
        'function symbol() view returns (string)'
    ];
    
    const wrappedToken = new ethers.Contract(wrapperAddress, erc20Abi, provider);
    const wrappedBalance = await wrappedToken.balanceOf(wallet.address);
    
    if (wrappedBalance.gt(0)) {
        const symbol = await wrappedToken.symbol();
        console.log('\n✅ Tokens are already wrapped!');
        console.log('Your balance:', ethers.utils.formatUnits(wrappedBalance.mul(10**12), 18), symbol);
        console.log('Raw balance:', wrappedBalance.toString(), 'wei');
        
        if (balance.eq(0)) {
            console.log('\nAll tokens have been wrapped successfully!');
            process.exit(0);
        }
    }

    if (balance.eq(0)) {
        console.log('\n❌ No unwrapped YES tokens found in your wallet');
        process.exit(0);
    }

    // Check approval
    console.log('\nChecking approval for factory...');
    const isApproved = await erc1155.isApprovedForAll(wallet.address, CONFIG.FACTORY_ADDRESS);
    
    if (!isApproved) {
        console.log('❌ Factory is not approved yet.');
        console.log('Please wait for the approval transaction to complete or run this script again to approve.');
        process.exit(1);
    } else {
        console.log('✅ Factory is approved');
    }

    // Wrap all available tokens
    const wrapAmount = balance;
    
    console.log('\n=== Wrapping Details ===');
    console.log('Amount:', wrapAmount.toString());
    console.log('Wrapper address:', wrapperAddress);

    // Execute wrapping
    console.log('\nSending tokens to factory for wrapping...');
    const wrapTx = await erc1155.safeTransferFrom(
        wallet.address,
        CONFIG.FACTORY_ADDRESS,
        CONFIG.YES_TOKEN_ID,
        wrapAmount,
        metadata,
        {
            gasLimit: 500000,
            gasPrice: ethers.utils.parseUnits('35', 'gwei')
        }
    );
    
    console.log('Transaction sent:', wrapTx.hash);
    console.log('Waiting for confirmation (this may take a minute)...');
    
    const receipt = await wrapTx.wait();
    console.log('✅ Tokens wrapped successfully!');
    console.log('Block:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());
    
    // Check new wrapped token balance
    const newWrappedBalance = await wrappedToken.balanceOf(wallet.address);
    const name = await wrappedToken.name();
    const symbol = await wrappedToken.symbol();
    
    console.log('\n=== Wrapped Token Info ===');
    console.log('Contract:', wrapperAddress);
    console.log('Name:', name);
    console.log('Symbol:', symbol);
    console.log('Your balance:', ethers.utils.formatUnits(newWrappedBalance.mul(10**12), 18), symbol);
    console.log('Raw balance:', newWrappedBalance.toString(), 'wei');
    
    console.log('\n✅ Success! Your YES tokens have been wrapped.');
    console.log('Add this token to MetaMask:', wrapperAddress);
    console.log('\nBoth YES and NO tokens are now wrapped and ready to view in the GUI!');
}

main().catch(console.error);