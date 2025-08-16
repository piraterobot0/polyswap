/**
 * Generate transaction data for Gnosis Safe transfers
 * This helps create the exact data needed for the Safe web interface
 */

const { Web3 } = require('web3');

// Configuration - UPDATE THESE
const CONFIG = {
    // Your addresses
    SAFE_ADDRESS: '0x...', // TODO: Your Gnosis Safe address
    EOA_ADDRESS: '0x884F5C47fA1eCaF0C8957611f648Fb320551ab51', // Your wallet
    FACTORY_ADDRESS: '0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1', // Factory contract
    
    // Token details
    ERC1155_CONTRACT: '0x...', // TODO: Your ERC-1155 contract
    TOKEN_ID: 1, // TODO: Token ID to transfer
    AMOUNT: '100', // TODO: Amount to transfer
    
    // For wrapping (if going directly to factory)
    WRAPPER_NAME: 'Wrapped Token',
    WRAPPER_SYMBOL: 'WRAP',
    WRAPPER_DECIMALS: 18
};

// Initialize Web3 (no provider needed for encoding)
const web3 = new Web3();

// ERC-1155 ABI for encoding
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
            {"name": "from", "type": "address"},
            {"name": "to", "type": "address"},
            {"name": "ids", "type": "uint256[]"},
            {"name": "amounts", "type": "uint256[]"},
            {"name": "data", "type": "bytes"}
        ],
        "name": "safeBatchTransferFrom",
        "outputs": [],
        "type": "function"
    }
];

// Helper to encode wrapper metadata
function encodeWrapperMetadata(name, symbol, decimals) {
    // Pad name to 32 bytes
    const nameBytes = web3.utils.utf8ToHex(name);
    const namePadded = web3.utils.padRight(nameBytes, 64);
    
    // Pad symbol to 32 bytes
    const symbolBytes = web3.utils.utf8ToHex(symbol);
    const symbolPadded = web3.utils.padRight(symbolBytes, 64);
    
    // Decimals as 1 byte
    const decimalsHex = decimals.toString(16).padStart(2, '0');
    
    // Combine all
    return '0x' + namePadded.slice(2) + symbolPadded.slice(2) + decimalsHex;
}

function generateTransactionData() {
    console.log('🔧 Gnosis Safe Transaction Data Generator');
    console.log('=========================================\n');
    
    // Create contract instance for encoding
    const erc1155 = new web3.eth.Contract(ERC1155_ABI, CONFIG.ERC1155_CONTRACT);
    
    console.log('📋 Configuration:');
    console.log('   Safe Address:', CONFIG.SAFE_ADDRESS);
    console.log('   ERC-1155 Contract:', CONFIG.ERC1155_CONTRACT);
    console.log('   Token ID:', CONFIG.TOKEN_ID);
    console.log('   Amount:', CONFIG.AMOUNT);
    console.log('');
    
    // Option 1: Transfer to EOA
    console.log('═══════════════════════════════════════════════════════');
    console.log('OPTION 1: Transfer to Your Wallet (Recommended)');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nFor Gnosis Safe Web Interface:');
    console.log('--------------------------------');
    console.log('1. Go to: https://app.safe.global/');
    console.log('2. Click "New Transaction" → "Contract Interaction"');
    console.log('3. Enter these values:\n');
    
    console.log('Contract Address:');
    console.log(CONFIG.ERC1155_CONTRACT);
    console.log('');
    
    console.log('ABI (copy this entire block):');
    console.log(JSON.stringify(ERC1155_ABI, null, 2));
    console.log('');
    
    console.log('Method: safeTransferFrom');
    console.log('');
    console.log('Parameters:');
    console.log('  from:', CONFIG.SAFE_ADDRESS);
    console.log('  to:', CONFIG.EOA_ADDRESS);
    console.log('  id:', CONFIG.TOKEN_ID);
    console.log('  amount:', CONFIG.AMOUNT);
    console.log('  data: 0x');
    
    // Generate encoded data
    const transferData = erc1155.methods.safeTransferFrom(
        CONFIG.SAFE_ADDRESS,
        CONFIG.EOA_ADDRESS,
        CONFIG.TOKEN_ID,
        CONFIG.AMOUNT,
        '0x'
    ).encodeABI();
    
    console.log('\n📦 Encoded Transaction Data:');
    console.log('(Alternative: paste this in "Transaction Data" field)');
    console.log(transferData);
    
    // Option 2: Direct wrap from Safe
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('OPTION 2: Direct Wrap from Safe (Advanced)');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nThis sends tokens directly to factory for wrapping.');
    console.log('--------------------------------');
    
    const wrapperMetadata = encodeWrapperMetadata(
        CONFIG.WRAPPER_NAME,
        CONFIG.WRAPPER_SYMBOL,
        CONFIG.WRAPPER_DECIMALS
    );
    
    console.log('\nWrapper Configuration:');
    console.log('  Name:', CONFIG.WRAPPER_NAME);
    console.log('  Symbol:', CONFIG.WRAPPER_SYMBOL);
    console.log('  Decimals:', CONFIG.WRAPPER_DECIMALS);
    console.log('  Encoded Metadata:', wrapperMetadata);
    
    console.log('\nParameters for Safe:');
    console.log('  from:', CONFIG.SAFE_ADDRESS);
    console.log('  to:', CONFIG.FACTORY_ADDRESS, '(Factory)');
    console.log('  id:', CONFIG.TOKEN_ID);
    console.log('  amount:', CONFIG.AMOUNT);
    console.log('  data:', wrapperMetadata);
    
    const wrapData = erc1155.methods.safeTransferFrom(
        CONFIG.SAFE_ADDRESS,
        CONFIG.FACTORY_ADDRESS,
        CONFIG.TOKEN_ID,
        CONFIG.AMOUNT,
        wrapperMetadata
    ).encodeABI();
    
    console.log('\n📦 Encoded Transaction Data for Direct Wrap:');
    console.log(wrapData);
    
    // Transaction Builder JSON
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('OPTION 3: Transaction Builder JSON');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nFor Safe Transaction Builder App:');
    console.log('--------------------------------');
    
    const txBuilderJson = {
        version: "1.0",
        chainId: "137",
        createdAt: Date.now(),
        meta: {
            name: "ERC-1155 Transfer",
            description: `Transfer ${CONFIG.AMOUNT} of token ${CONFIG.TOKEN_ID} to EOA`
        },
        transactions: [
            {
                to: CONFIG.ERC1155_CONTRACT,
                value: "0",
                data: transferData,
                contractMethod: {
                    inputs: ERC1155_ABI[0].inputs,
                    name: "safeTransferFrom",
                    payable: false
                },
                contractInputsValues: {
                    from: CONFIG.SAFE_ADDRESS,
                    to: CONFIG.EOA_ADDRESS,
                    id: CONFIG.TOKEN_ID.toString(),
                    amount: CONFIG.AMOUNT,
                    data: "0x"
                }
            }
        ]
    };
    
    console.log('Copy this JSON:');
    console.log(JSON.stringify(txBuilderJson, null, 2));
    
    // Batch transfer example
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('BONUS: Batch Transfer Multiple Tokens');
    console.log('═══════════════════════════════════════════════════════');
    
    const batchIds = [1, 2, 3]; // Example token IDs
    const batchAmounts = ['100', '200', '300']; // Example amounts
    
    console.log('\nFor multiple tokens at once:');
    console.log('  Method: safeBatchTransferFrom');
    console.log('  ids:', JSON.stringify(batchIds));
    console.log('  amounts:', JSON.stringify(batchAmounts));
    
    const batchData = erc1155.methods.safeBatchTransferFrom(
        CONFIG.SAFE_ADDRESS,
        CONFIG.EOA_ADDRESS,
        batchIds,
        batchAmounts,
        '0x'
    ).encodeABI();
    
    console.log('\n📦 Encoded Batch Transfer Data:');
    console.log(batchData);
    
    // Summary
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('📌 NEXT STEPS');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n1. Copy the appropriate data above');
    console.log('2. Go to https://app.safe.global/');
    console.log('3. Create new transaction');
    console.log('4. Paste the data');
    console.log('5. Sign and execute');
    console.log('\n✅ After transfer completes:');
    console.log('   - If transferred to EOA: Run wrap-tokens.js');
    console.log('   - If sent to factory: Wrapped tokens are ready!');
    
    // Calculate wrapper address
    const factoryABI = require('../1155_converter/1155-to-20-master/build/contracts/Wrapped1155Factory.json').abi;
    const factory = new web3.eth.Contract(factoryABI, CONFIG.FACTORY_ADDRESS);
    
    console.log('\n🔮 Predicted Wrapper Address:');
    console.log('   (This will be your ERC-20 token address)');
    console.log('   Run check-balances.js after wrapping to verify');
}

// Run
generateTransactionData();