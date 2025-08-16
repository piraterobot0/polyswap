const { ethers } = require('ethers');

// Configuration
const CONFIG = {
    // Gnosis Safe that holds the tokens
    SAFE_ADDRESS: '0x27dBD952974cbFd2fEbD87890a82B50225e97bC9',
    
    // Factory contract on Polygon
    FACTORY_ADDRESS: '0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1',
    
    // ERC-1155 contract (Polymarket CTF Exchange)
    ERC1155_CONTRACT: '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045',
    
    // YES token ID for "Will Google have the best AI model by September 2025"
    YES_TOKEN_ID: '65880048952541620153230365826580171049439578129923156747663728476967119230732',
    
    // NO token ID (already wrapped)
    NO_TOKEN_ID: '106277356443369138797049499065953438334187241175412976556484145976288075138631',
    
    // Your EOA address
    YOUR_WALLET: '0x884F5C47fA1eCaF0C8957611f648Fb320551ab51',
    
    // Token metadata for wrapping
    TOKEN_NAME: 'Wrapped POSI YES Google AI Sept',
    TOKEN_SYMBOL: 'wPOSI-YES',
    TOKEN_DECIMALS: 18
};

// Helper function to encode metadata
function encodeMetadata(name, symbol, decimals) {
    // Pad name to 32 bytes
    const nameHex = ethers.utils.formatBytes32String(name);
    
    // Pad symbol to 32 bytes
    const symbolHex = ethers.utils.formatBytes32String(symbol);
    
    // Decimals as 1 byte
    const decimalsHex = ethers.utils.hexlify(decimals).slice(2).padStart(2, '0');
    
    // Combine all parts (remove 0x prefix from symbol and decimals)
    return nameHex + symbolHex.slice(2) + decimalsHex;
}

// Calculate deterministic wrapper address
async function getWrapperAddress() {
    const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');
    
    // Factory ABI for getWrapped1155
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
    
    return wrapperAddress;
}

async function main() {
    console.log('=== Google AI Prediction Market - YES Token Wrapper ===\n');
    
    console.log('Token Details:');
    console.log('- Question: Will Google have the best AI model by September 2025?');
    console.log('- Outcome: YES');
    console.log('- Token ID:', CONFIG.YES_TOKEN_ID);
    console.log('- Name:', CONFIG.TOKEN_NAME);
    console.log('- Symbol:', CONFIG.TOKEN_SYMBOL);
    console.log('- Decimals:', CONFIG.TOKEN_DECIMALS);
    console.log();
    
    // Calculate wrapper address
    console.log('Calculating wrapper address...');
    const wrapperAddress = await getWrapperAddress();
    console.log('✅ Wrapper will be deployed at:', wrapperAddress);
    console.log();
    
    // Encode metadata
    const metadata = encodeMetadata(CONFIG.TOKEN_NAME, CONFIG.TOKEN_SYMBOL, CONFIG.TOKEN_DECIMALS);
    console.log('Encoded metadata:', metadata);
    console.log();
    
    console.log('=== Instructions for Wrapping ===\n');
    
    console.log('Option 1: From Gnosis Safe (if tokens are still there)');
    console.log('1. Go to https://app.safe.global/');
    console.log('2. Connect to your Safe:', CONFIG.SAFE_ADDRESS);
    console.log('3. Create new transaction -> Contract interaction');
    console.log('4. Contract address:', CONFIG.ERC1155_CONTRACT);
    console.log('5. Method: safeTransferFrom');
    console.log('6. Parameters:');
    console.log('   - from:', CONFIG.SAFE_ADDRESS);
    console.log('   - to:', CONFIG.FACTORY_ADDRESS);
    console.log('   - id:', CONFIG.YES_TOKEN_ID);
    console.log('   - amount: [your amount]');
    console.log('   - data:', metadata);
    console.log();
    
    console.log('Option 2: From your wallet (if already transferred)');
    console.log('1. Make sure tokens are in:', CONFIG.YOUR_WALLET);
    console.log('2. Run: node scripts/execute-wrap-yes.js');
    console.log();
    
    console.log('=== Comparison with NO Token ===');
    console.log('NO Token (already wrapped):');
    console.log('- Token ID:', CONFIG.NO_TOKEN_ID);
    console.log('- Wrapper: 0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5');
    console.log();
    console.log('YES Token (to be wrapped):');
    console.log('- Token ID:', CONFIG.YES_TOKEN_ID);
    console.log('- Wrapper:', wrapperAddress);
}

main().catch(console.error);