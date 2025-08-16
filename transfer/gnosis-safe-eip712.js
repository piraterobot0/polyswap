const Web3 = require('web3');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Gnosis Safe domain and types for EIP-712
const SAFE_TX_TYPEHASH = '0xbb8310d486368db6bd6f849402fdd73ad53d316b5a4b2644ad6efe0f941286d8';

const EIP712_DOMAIN = {
    name: 'Gnosis Safe',
    version: '1.3.0',
    verifyingContract: '', // Add your Safe address here
    chainId: 137 // Polygon mainnet
};

const SAFE_TX_TYPE = {
    SafeTx: [
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'data', type: 'bytes' },
        { name: 'operation', type: 'uint8' },
        { name: 'safeTxGas', type: 'uint256' },
        { name: 'baseGas', type: 'uint256' },
        { name: 'gasPrice', type: 'uint256' },
        { name: 'gasToken', type: 'address' },
        { name: 'refundReceiver', type: 'address' },
        { name: 'nonce', type: 'uint256' }
    ]
};

// Minimal ABIs
const GNOSIS_SAFE_ABI = [
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
            {"name": "signatures", "type": "bytes"}
        ],
        "name": "execTransaction",
        "outputs": [{"name": "success", "type": "bool"}],
        "type": "function",
        "payable": true
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

async function executeTransfer() {
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
        console.log('=== Gnosis Safe ERC-1155 Transfer (EIP-712) ===\n');
        console.log('Safe Address:', SAFE_ADDRESS);
        console.log('Your Address:', account.address);
        
        // Get current nonce
        const safeContract = new web3.eth.Contract(GNOSIS_SAFE_ABI, SAFE_ADDRESS);
        const nonce = await safeContract.methods.nonce().call();
        console.log('Current Nonce:', nonce);
        
        // Encode the ERC1155 transfer
        const erc1155 = new web3.eth.Contract(ERC1155_ABI, TOKEN_CONTRACT);
        const transferData = erc1155.methods.safeTransferFrom(
            SAFE_ADDRESS,
            TO_ADDRESS,
            TOKEN_ID,
            AMOUNT,
            '0x'
        ).encodeABI();
        
        // Create the Safe transaction
        const safeTx = {
            to: TOKEN_CONTRACT,
            value: '0',
            data: transferData,
            operation: 0, // Call
            safeTxGas: '0',
            baseGas: '0',
            gasPrice: '0',
            gasToken: '0x0000000000000000000000000000000000000000',
            refundReceiver: '0x0000000000000000000000000000000000000000',
            nonce: nonce
        };
        
        // Create EIP-712 typed data
        const typedData = {
            types: {
                EIP712Domain: [
                    { name: 'chainId', type: 'uint256' },
                    { name: 'verifyingContract', type: 'address' }
                ],
                SafeTx: SAFE_TX_TYPE.SafeTx
            },
            domain: {
                chainId: 137,
                verifyingContract: SAFE_ADDRESS
            },
            primaryType: 'SafeTx',
            message: safeTx
        };
        
        console.log('\n=== Transaction Details ===');
        console.log('Transferring', AMOUNT, 'token(s) to:', TO_ADDRESS);
        
        // Sign using EIP-712
        console.log('\nSigning with EIP-712...');
        
        // We need to use eth_signTypedData_v4 which web3.js doesn't support directly
        // So we'll compute the hash manually
        const encoder = web3.eth.abi;
        const domainSeparator = web3.utils.keccak256(
            encoder.encodeParameters(
                ['bytes32', 'uint256', 'address'],
                [
                    web3.utils.keccak256('EIP712Domain(uint256 chainId,address verifyingContract)'),
                    137,
                    SAFE_ADDRESS
                ]
            )
        );
        
        const safeTxHash = web3.utils.keccak256(
            encoder.encodeParameters(
                ['bytes32', 'address', 'uint256', 'bytes32', 'uint8', 'uint256', 'uint256', 'uint256', 'address', 'address', 'uint256'],
                [
                    SAFE_TX_TYPEHASH,
                    safeTx.to,
                    safeTx.value,
                    web3.utils.keccak256(safeTx.data),
                    safeTx.operation,
                    safeTx.safeTxGas,
                    safeTx.baseGas,
                    safeTx.gasPrice,
                    safeTx.gasToken,
                    safeTx.refundReceiver,
                    safeTx.nonce
                ]
            )
        );
        
        const hash = web3.utils.soliditySha3(
            { t: 'bytes1', v: '0x19' },
            { t: 'bytes1', v: '0x01' },
            { t: 'bytes32', v: domainSeparator },
            { t: 'bytes32', v: safeTxHash }
        );
        
        console.log('Transaction hash:', hash);
        
        // Sign the hash
        const signature = account.sign(hash);
        
        // Adjust v value for Gnosis Safe (should be 27 or 28)
        let v = parseInt(signature.v, 16);
        if (v < 27) v += 27;
        
        const formattedSig = signature.r.slice(2) + signature.s.slice(2) + v.toString(16).padStart(2, '0');
        console.log('Signature:', '0x' + formattedSig);
        
        // Execute the transaction
        console.log('\n✅ Executing Safe transaction...');
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
            '0x' + formattedSig
        );
        
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
        if (error.message.includes('GS026')) {
            console.log('\n❌ Signature error (GS026). This usually means:');
            console.log('- The signature format is incorrect');
            console.log('- The signer is not an owner');
            console.log('- The transaction data doesn\'t match what was signed');
        }
    }
}

async function main() {
    if (!process.env.PRIVATE_KEY) {
        console.error('Please set PRIVATE_KEY in .env file');
        process.exit(1);
    }
    
    await executeTransfer();
}

if (require.main === module) {
    main().catch(console.error);
}