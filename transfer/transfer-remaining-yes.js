const Web3 = require('web3');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Copy the ABI from simple-safe-transfer.js
const GNOSIS_SAFE_ABI = [
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

async function main() {
    const web3 = new Web3('https://polygon-rpc.com');
    
    const config = {
        SAFE_ADDRESS: '0x27dBD952974cbFd2fEbD87890a82B50225e97bC9',
        TOKEN_CONTRACT: '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045',
        TO_ADDRESS: '0x884F5C47fA1eCaF0C8957611f648Fb320551ab51',
        TOKEN_ID: '65880048952541620153230365826580171049439578129923156747663728476967119230732', // YES token
        AMOUNT: '2000000'
    };
    
    const account = web3.eth.accounts.privateKeyToAccount('0x' + process.env.PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);
    
    console.log('=== Transfer Remaining YES Tokens ===\n');
    
    const safeContract = new web3.eth.Contract(GNOSIS_SAFE_ABI, config.SAFE_ADDRESS);
    const erc1155 = new web3.eth.Contract(ERC1155_ABI, config.TOKEN_CONTRACT);
    
    // Check current balance
    const balance = await erc1155.methods.balanceOf(config.SAFE_ADDRESS, config.TOKEN_ID).call();
    console.log('Current YES balance in Safe:', balance);
    
    if (balance === '0') {
        console.log('No YES tokens left in Safe');
        return;
    }
    
    // Check Safe info
    const nonce = await safeContract.methods.nonce().call();
    console.log('Safe nonce:', nonce);
    
    // Encode transfer
    const transferData = erc1155.methods.safeTransferFrom(
        config.SAFE_ADDRESS,
        config.TO_ADDRESS,
        config.TOKEN_ID,
        balance, // Transfer all remaining
        '0x'
    ).encodeABI();
    
    console.log('\nTransferring', balance, 'YES tokens...');
    
    // Create signature for sole owner
    const approvedHashSignature = '0x000000000000000000000000' + 
        account.address.slice(2).toLowerCase() + 
        '0000000000000000000000000000000000000000000000000000000000000000' + 
        '01';
    
    // Execute transaction
    const tx = await safeContract.methods.execTransaction(
        config.TOKEN_CONTRACT,
        0,
        transferData,
        0, // CALL operation
        0, // safeTxGas
        0, // baseGas
        0, // gasPrice
        '0x0000000000000000000000000000000000000000', // gasToken
        '0x0000000000000000000000000000000000000000', // refundReceiver
        approvedHashSignature
    ).send({
        from: account.address,
        gas: 200000,
        gasPrice: web3.utils.toWei('50', 'gwei')
    });
    
    console.log('\n✅ Transfer successful!');
    console.log('Transaction hash:', tx.transactionHash);
    console.log('Gas used:', tx.gasUsed);
}

main().catch(console.error);