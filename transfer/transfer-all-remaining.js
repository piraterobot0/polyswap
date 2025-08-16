const Web3 = require('web3');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const GNOSIS_SAFE_ABI = require('./abis/gnosis-safe.json');
const ERC1155_ABI = [
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

async function main() {
    const web3 = new Web3('https://polygon-rpc.com');
    
    const config = {
        SAFE_ADDRESS: '0x27dBD952974cbFd2fEbD87890a82B50225e97bC9',
        TOKEN_CONTRACT: '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045',
        TO_ADDRESS: '0x884F5C47fA1eCaF0C8957611f648Fb320551ab51',
        YES_TOKEN_ID: '65880048952541620153230365826580171049439578129923156747663728476967119230732',
        NO_TOKEN_ID: '106277356443369138797049499065953438334187241175412976556484145976288075138631',
        YES_AMOUNT: '2000000',
        NO_AMOUNT: '999999'
    };
    
    const account = web3.eth.accounts.privateKeyToAccount('0x' + process.env.PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);
    
    console.log('=== Batch Transfer from Gnosis Safe ===\n');
    console.log('Safe:', config.SAFE_ADDRESS);
    console.log('To:', config.TO_ADDRESS);
    console.log('YES tokens:', config.YES_AMOUNT);
    console.log('NO tokens:', config.NO_AMOUNT);
    
    const safeContract = new web3.eth.Contract(GNOSIS_SAFE_ABI, config.SAFE_ADDRESS);
    
    // Check Safe info
    const threshold = await safeContract.methods.getThreshold().call();
    const owners = await safeContract.methods.getOwners().call();
    const nonce = await safeContract.methods.nonce().call();
    
    console.log('\nSafe Info:');
    console.log('- Threshold:', threshold);
    console.log('- Owners:', owners);
    console.log('- Nonce:', nonce);
    console.log('- Your address:', account.address);
    console.log('- You are owner:', owners.map(o => o.toLowerCase()).includes(account.address.toLowerCase()));
    
    // Encode batch transfer
    const erc1155 = new web3.eth.Contract(ERC1155_ABI, config.TOKEN_CONTRACT);
    const transferData = erc1155.methods.safeBatchTransferFrom(
        config.SAFE_ADDRESS,
        config.TO_ADDRESS,
        [config.YES_TOKEN_ID, config.NO_TOKEN_ID],
        [config.YES_AMOUNT, config.NO_AMOUNT],
        '0x'
    ).encodeABI();
    
    console.log('\n=== Executing Batch Transfer ===');
    console.log('Transferring both YES and NO tokens in one transaction...');
    
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
        gas: 500000,
        gasPrice: web3.utils.toWei('50', 'gwei')
    });
    
    console.log('\n✅ Batch transfer successful!');
    console.log('Transaction hash:', tx.transactionHash);
    console.log('Gas used:', tx.gasUsed);
    console.log('\nBoth YES and NO tokens have been transferred to:', config.TO_ADDRESS);
}

main().catch(console.error);