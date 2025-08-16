/**
 * Check what ERC-1155 tokens you have
 */

const { Web3 } = require('web3');
require('dotenv').config();

const ERC1155_CONTRACT = '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045';
const YOUR_WALLET = '0x884F5C47fA1eCaF0C8957611f648Fb320551ab51';

async function checkBalances() {
    const apiKey = process.env.METAMASK_API_KEY;
    const web3 = new Web3(`https://polygon-mainnet.infura.io/v3/${apiKey}`);
    
    console.log('🔍 Checking ERC-1155 Balances');
    console.log('==============================');
    console.log('Contract:', ERC1155_CONTRACT);
    console.log('Your Wallet:', YOUR_WALLET);
    console.log('');
    
    // Try to find Transfer events to your wallet
    console.log('📊 Looking for recent transfers to your wallet...\n');
    
    // Get recent Transfer events
    const topics = [
        web3.utils.sha3('TransferSingle(address,address,address,uint256,uint256)'),
        null, // operator
        null, // from
        web3.utils.padLeft(YOUR_WALLET.toLowerCase(), 64) // to (your wallet)
    ];
    
    try {
        const logs = await web3.eth.getPastLogs({
            address: ERC1155_CONTRACT,
            topics: topics,
            fromBlock: 'latest',
            toBlock: 'latest'
        });
        
        if (logs.length === 0) {
            // Try wider range
            const currentBlock = await web3.eth.getBlockNumber();
            const fromBlock = currentBlock - 1000n; // Last 1000 blocks
            
            console.log(`Searching last 1000 blocks (${fromBlock} to ${currentBlock})...\n`);
            
            const historicalLogs = await web3.eth.getPastLogs({
                address: ERC1155_CONTRACT,
                topics: topics,
                fromBlock: fromBlock.toString(),
                toBlock: 'latest'
            });
            
            if (historicalLogs.length > 0) {
                console.log(`Found ${historicalLogs.length} transfer(s) to your wallet:\n`);
                
                for (const log of historicalLogs) {
                    // Decode the log
                    const tokenId = web3.utils.toBN(log.topics[3] || log.data.slice(0, 66));
                    const amount = web3.utils.toBN('0x' + log.data.slice(66, 130));
                    
                    console.log('Transfer Event:');
                    console.log('  Block:', log.blockNumber);
                    console.log('  Token ID:', tokenId.toString());
                    console.log('  Amount:', amount.toString());
                    console.log('  Tx Hash:', log.transactionHash);
                    console.log('');
                    
                    // Check current balance
                    const balanceABI = [{
                        "inputs": [
                            {"name": "account", "type": "address"},
                            {"name": "id", "type": "uint256"}
                        ],
                        "name": "balanceOf",
                        "outputs": [{"name": "", "type": "uint256"}],
                        "type": "function"
                    }];
                    
                    const contract = new web3.eth.Contract(balanceABI, ERC1155_CONTRACT);
                    const currentBalance = await contract.methods.balanceOf(YOUR_WALLET, tokenId.toString()).call();
                    console.log('  Current Balance:', currentBalance);
                    console.log('');
                }
            } else {
                console.log('No transfers found in recent blocks.');
            }
        }
        
        // Also check TransferBatch events
        const batchTopics = [
            web3.utils.sha3('TransferBatch(address,address,address,uint256[],uint256[])'),
            null,
            null,
            web3.utils.padLeft(YOUR_WALLET.toLowerCase(), 64)
        ];
        
        const currentBlock = await web3.eth.getBlockNumber();
        const batchLogs = await web3.eth.getPastLogs({
            address: ERC1155_CONTRACT,
            topics: batchTopics,
            fromBlock: (currentBlock - 1000n).toString(),
            toBlock: 'latest'
        });
        
        if (batchLogs.length > 0) {
            console.log(`Found ${batchLogs.length} batch transfer(s) to your wallet`);
            // Batch transfers would need more complex decoding
        }
        
    } catch (error) {
        console.error('Error fetching logs:', error.message);
    }
    
    // Try some common token IDs
    console.log('\n📋 Checking common token IDs...');
    const commonIds = ['0', '1', '2', '3', '100', '1000'];
    
    const balanceABI = [{
        "inputs": [
            {"name": "account", "type": "address"},
            {"name": "id", "type": "uint256"}
        ],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    }];
    
    const contract = new web3.eth.Contract(balanceABI, ERC1155_CONTRACT);
    
    for (const id of commonIds) {
        const balance = await contract.methods.balanceOf(YOUR_WALLET, id).call();
        if (balance !== '0') {
            console.log(`  Token ID ${id}: Balance = ${balance} ✅`);
        }
    }
    
    console.log('\n💡 To wrap a specific token:');
    console.log('   node wrap-1155-now.js TOKEN_ID AMOUNT');
}

checkBalances().catch(console.error);