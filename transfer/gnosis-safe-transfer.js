const Web3 = require('web3');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Gnosis Safe ABI (minimal - only what we need)
const GNOSIS_SAFE_ABI = [
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
        "inputs": [
            {"name": "owner", "type": "address"}
        ],
        "name": "isOwner",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function",
        "constant": true
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
        "outputs": [{"name": "success", "type": "bool"}],
        "type": "function",
        "payable": true
    },
    {
        "inputs": [],
        "name": "nonce",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function",
        "constant": true
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
            {"name": "_nonce", "type": "uint256"}
        ],
        "name": "getTransactionHash",
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

async function checkSafeInfo() {
    const web3 = new Web3(process.env.POLYGON_INFURA || 'https://polygon-rpc.com/');
    const SAFE_ADDRESS = '0x27dBD952974cbFd2fEbD87890a82B50225e97bC9';
    
    const safeContract = new web3.eth.Contract(GNOSIS_SAFE_ABI, SAFE_ADDRESS);
    
    try {
        const owners = await safeContract.methods.getOwners().call();
        const threshold = await safeContract.methods.getThreshold().call();
        const nonce = await safeContract.methods.nonce().call();
        
        const account = web3.eth.accounts.privateKeyToAccount('0x' + process.env.PRIVATE_KEY);
        const isOwner = await safeContract.methods.isOwner(account.address).call();
        
        console.log('=== Gnosis Safe Info ===');
        console.log('Safe Address:', SAFE_ADDRESS);
        console.log('Owners:', owners);
        console.log('Threshold:', threshold + '/' + owners.length);
        console.log('Current Nonce:', nonce);
        console.log('\nYour Address:', account.address);
        console.log('You are an owner:', isOwner);
        
        return { owners, threshold, isOwner, nonce };
    } catch (error) {
        console.error('Error getting Safe info:', error.message);
        return null;
    }
}

async function createSafeTransferTransaction() {
    const web3 = new Web3(process.env.POLYGON_INFURA || 'https://polygon-rpc.com/');
    
    // Configuration - UPDATE THESE VALUES
    const SAFE_ADDRESS = ''; // Your Gnosis Safe address
    const TOKEN_CONTRACT = ''; // ERC-1155 token contract
    const TO_ADDRESS = ''; // Destination address
    const TOKEN_ID = ''; // Token ID to transfer
    const AMOUNT = '1'; // Amount to transfer
    
    const account = web3.eth.accounts.privateKeyToAccount('0x' + process.env.PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);
    
    try {
        // Check Safe info first
        const safeInfo = await checkSafeInfo();
        if (!safeInfo) {
            return;
        }
        
        // Check token balance
        const erc1155 = new web3.eth.Contract(ERC1155_ABI, TOKEN_CONTRACT);
        const balance = await erc1155.methods.balanceOf(SAFE_ADDRESS, TOKEN_ID).call();
        console.log('\n=== Token Balance ===');
        console.log('Token Balance in Safe:', balance);
        
        if (parseInt(balance) === 0) {
            console.log('No tokens to transfer!');
            return;
        }
        
        // Encode the ERC1155 transfer
        const transferData = erc1155.methods.safeTransferFrom(
            SAFE_ADDRESS,
            TO_ADDRESS,
            TOKEN_ID,
            AMOUNT,
            '0x'
        ).encodeABI();
        
        // Safe transaction parameters
        const safeTx = {
            to: TOKEN_CONTRACT,
            value: 0,
            data: transferData,
            operation: 0, // 0 = Call, 1 = DelegateCall
            safeTxGas: 0,
            baseGas: 0,
            gasPrice: 0,
            gasToken: '0x0000000000000000000000000000000000000000',
            refundReceiver: '0x0000000000000000000000000000000000000000',
            nonce: safeInfo.nonce
        };
        
        // Get transaction hash
        const safeContract = new web3.eth.Contract(GNOSIS_SAFE_ABI, SAFE_ADDRESS);
        const txHash = await safeContract.methods.getTransactionHash(
            safeTx.to,
            safeTx.value,
            safeTx.data,
            safeTx.operation,
            safeTx.safeTxGas,
            safeTx.baseGas,
            safeTx.gasPrice,
            safeTx.gasToken,
            safeTx.refundReceiver,
            safeTx.nonce
        ).call();
        
        console.log('\n=== Transaction Details ===');
        console.log('Safe Transaction Hash:', txHash);
        console.log('Target Contract:', TOKEN_CONTRACT);
        console.log('Transfer:', AMOUNT, 'token(s) from Safe to', TO_ADDRESS);
        
        if (safeInfo.isOwner) {
            console.log('\n✅ You are a Safe owner!');
            
            // Sign the transaction hash
            const signature = account.sign(txHash);
            
            // Format signature for Gnosis Safe (r + s + v)
            const sig = signature.signature.slice(2); // Remove 0x
            const r = '0x' + sig.slice(0, 64);
            const s = '0x' + sig.slice(64, 128);
            const v = parseInt(sig.slice(128, 130), 16);
            
            // Gnosis Safe expects v to be 27 or 28 for EOA signatures
            const adjustedV = v < 27 ? v + 27 : v;
            
            // Reconstruct signature with adjusted v
            const formattedSignature = r.slice(2) + s.slice(2) + adjustedV.toString(16).padStart(2, '0');
            console.log('Formatted signature for Safe:', '0x' + formattedSignature);
            
            if (parseInt(safeInfo.threshold) === 1) {
                console.log('\n✅ Threshold is 1, executing transaction...');
                
                // For threshold=1, we can execute directly
                const tx = safeContract.methods.execTransaction(
                    safeTx.to,
                    safeTx.value,
                    safeTx.data,
                    safeTx.operation,
                    safeTx.safeTxGas,
                    safeTx.baseGas,
                    safeTx.gasPrice,
                    safeTx.gasToken,
                    safeTx.refundReceiver,
                    '0x' + formattedSignature
                );
                
                const gas = await tx.estimateGas({ from: account.address });
                const gasPrice = await web3.eth.getGasPrice();
                
                const receipt = await tx.send({
                    from: account.address,
                    gas: Math.floor(gas * 1.2),
                    gasPrice: gasPrice
                });
                
                console.log('\n✅ Transaction executed!');
                console.log('Transaction hash:', receipt.transactionHash);
            } else {
                console.log('\n⚠️ Threshold is', safeInfo.threshold);
                console.log('You need', safeInfo.threshold - 1, 'more signature(s) to execute.');
                console.log('\nShare this with other owners:');
                console.log('Transaction Hash to Sign:', txHash);
                console.log('\nOr use Gnosis Safe interface: https://app.safe.global/');
            }
        } else {
            console.log('\n❌ You are not a Safe owner.');
            console.log('Only Safe owners can execute transactions.');
            console.log('\nOptions:');
            console.log('1. Contact one of the Safe owners:', safeInfo.owners);
            console.log('2. Use Polymarket interface to withdraw tokens');
        }
        
    } catch (error) {
        console.error('\nError:', error.message);
    }
}

async function main() {
    console.log('=== Gnosis Safe ERC-1155 Transfer ===\n');
    
    if (!process.env.PRIVATE_KEY) {
        console.error('Please set PRIVATE_KEY in .env file');
        process.exit(1);
    }
    
    await createSafeTransferTransaction();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { checkSafeInfo, createSafeTransferTransaction };