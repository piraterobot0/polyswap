const Web3 = require('web3');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Simple approach - if you're the only owner with threshold 1
// This uses pre-validated signatures which Gnosis Safe accepts

const GNOSIS_SAFE_ABI = [
    {
        "inputs": [
            {"name": "to", "type": "address"},
            {"name": "value", "type": "uint256"},
            {"name": "data", "type": "bytes"},
            {"name": "operation", "type": "uint8"}
        ],
        "name": "execTransactionFromModule",
        "outputs": [{"name": "success", "type": "bool"}],
        "type": "function"
    },
    {
        "inputs": [
            {"name": "to", "type": "address"},
            {"name": "value", "type": "uint256"},
            {"name": "data", "type": "bytes"},
            {"name": "operation", "type": "uint8"},
            {"name": "safeTxGas", "type": "uint256"},
            {"name": "baseGas", "type": "uint256"},
            {"name": "gasPrice", "type": "uint256"},
            {"name": "gasToken", "type": "address"},
            {"name": "refundReceiver", "type": "address"},
            {"name": "signatures", "type": "bytes"}
        ],
        "name": "execTransaction",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function",
        "payable": true
    },
    {
        "inputs": [],
        "name": "getOwners",
        "outputs": [{"name": "", "type": "address[]"}],
        "type": "function",
        "constant": true
    },
    {
        "inputs": [],
        "name": "getThreshold", 
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function",
        "constant": true
    },
    {
        "inputs": [],
        "name": "nonce",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function",
        "constant": true
    },
    {
        "inputs": [],
        "name": "VERSION",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function",
        "constant": true
    },
    {
        "inputs": [],
        "name": "domainSeparator",
        "outputs": [{"name": "", "type": "bytes32"}],
        "type": "function",
        "constant": true
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

async function simpleSafeTransfer() {
    const web3 = new Web3(process.env.POLYGON_INFURA || 'https://polygon-rpc.com/');
    
    // Load configuration
    let config;
    try {
        config = require('./config.js');
    } catch (e) {
        console.error('Config file not found. Please create config.js from config.example.js');
        process.exit(1);
    }
    
    const SAFE_ADDRESS = config.SAFE_ADDRESS;
    const TOKEN_CONTRACT = config.TOKEN_CONTRACT;
    const TO_ADDRESS = config.TO_ADDRESS;
    const TOKEN_ID = config.TOKEN_ID;
    const AMOUNT = config.AMOUNT || '1';
    
    const account = web3.eth.accounts.privateKeyToAccount('0x' + process.env.PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);
    
    try {
        console.log('=== Simple Gnosis Safe Transfer ===\n');
        
        const safeContract = new web3.eth.Contract(GNOSIS_SAFE_ABI, SAFE_ADDRESS);
        
        // Get Safe info
        const [owners, threshold, nonce, version] = await Promise.all([
            safeContract.methods.getOwners().call(),
            safeContract.methods.getThreshold().call(),
            safeContract.methods.nonce().call(),
            safeContract.methods.VERSION().call().catch(() => '1.3.0')
        ]);
        
        console.log('Safe Info:');
        console.log('- Address:', SAFE_ADDRESS);
        console.log('- Version:', version);
        console.log('- Owners:', owners);
        console.log('- Threshold:', threshold);
        console.log('- Nonce:', nonce);
        console.log('- Your address:', account.address);
        console.log('- You are owner:', owners.map(o => o.toLowerCase()).includes(account.address.toLowerCase()));
        
        if (!owners.map(o => o.toLowerCase()).includes(account.address.toLowerCase())) {
            console.log('\n❌ You are not an owner of this Safe');
            return;
        }
        
        // Encode transfer
        const erc1155 = new web3.eth.Contract(ERC1155_ABI, TOKEN_CONTRACT);
        const transferData = erc1155.methods.safeTransferFrom(
            SAFE_ADDRESS,
            TO_ADDRESS,
            TOKEN_ID,
            AMOUNT,
            '0x'
        ).encodeABI();
        
        console.log('\n=== Attempting Transfer ===');
        console.log('From Safe:', SAFE_ADDRESS);
        console.log('To:', TO_ADDRESS);
        console.log('Token:', TOKEN_ID);
        console.log('Amount:', AMOUNT);
        
        // For a 1/1 Safe, we can use a simpler signature approach
        // The signature for a sole owner can be constructed as follows:
        // For approved hash: r=owner_address, s=0, v=1
        const ownerAddress = account.address.toLowerCase().slice(2);
        const approvedHashSignature = '0x' + 
            '000000000000000000000000' + ownerAddress + // r (padded owner address)
            '0000000000000000000000000000000000000000000000000000000000000000' + // s (zero)
            '01'; // v = 1 for approved hash
        
        console.log('\nUsing approved hash signature for sole owner...');
        
        const tx = safeContract.methods.execTransaction(
            TOKEN_CONTRACT,
            0,
            transferData,
            0, // Call operation
            0, // safeTxGas
            0, // baseGas
            0, // gasPrice
            '0x0000000000000000000000000000000000000000',
            '0x0000000000000000000000000000000000000000',
            approvedHashSignature
        );
        
        const gas = await tx.estimateGas({ from: account.address }).catch(e => {
            console.log('Gas estimation failed:', e.message);
            return 500000; // Fallback gas
        });
        
        const gasPrice = await web3.eth.getGasPrice();
        
        console.log('\nExecuting transaction...');
        const receipt = await tx.send({
            from: account.address,
            gas: Math.floor(gas * 1.5),
            gasPrice: gasPrice
        });
        
        console.log('\n✅ Transfer successful!');
        console.log('Transaction hash:', receipt.transactionHash);
        console.log('Gas used:', receipt.gasUsed);
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        
        // Try to decode the error
        if (error.message.includes('GS')) {
            const errorCode = error.message.match(/GS\d+/)?.[0];
            console.log('\nGnosis Safe Error Code:', errorCode);
            const errorMessages = {
                'GS000': 'Could not finish initialization',
                'GS001': 'Threshold needs to be defined',
                'GS010': 'Not enough gas to execute transaction',
                'GS011': 'Could not pay gas costs with ether',
                'GS012': 'Could not pay gas costs with token',
                'GS013': 'Safe transaction failed when gasPrice and safeTxGas were 0',
                'GS020': 'Signatures data too short',
                'GS021': 'Invalid contract signature location',
                'GS022': 'Invalid contract signature provided',
                'GS023': 'Contract signature wrong offset',
                'GS024': 'Invalid contract signature',
                'GS025': 'Hash has not been approved',
                'GS026': 'Invalid signature provided',
                'GS030': 'Only owners can approve a hash',
                'GS031': 'Hash already approved'
            };
            if (errorMessages[errorCode]) {
                console.log('Meaning:', errorMessages[errorCode]);
            }
        }
    }
}

async function main() {
    if (!process.env.PRIVATE_KEY) {
        console.error('Please set PRIVATE_KEY in .env file');
        process.exit(1);
    }
    
    await simpleSafeTransfer();
}

if (require.main === module) {
    main().catch(console.error);
}