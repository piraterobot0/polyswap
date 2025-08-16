/**
 * Find where the ERC-1155 tokens are
 */

const { Web3 } = require('web3');
require('dotenv').config();

const ERC1155_CONTRACT = '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045';
const YOUR_WALLET = '0x884F5C47fA1eCaF0C8957611f648Fb320551ab51';
const SAFE_ADDRESS = '0x27dBD952974cbFd2fEbD87890a82B50225e97bC9';

async function findTokens() {
    const apiKey = process.env.METAMASK_API_KEY;
    const web3 = new Web3(`https://polygon-mainnet.infura.io/v3/${apiKey}`);
    
    console.log('🔍 Finding ERC-1155 Tokens');
    console.log('===========================');
    console.log('Contract:', ERC1155_CONTRACT);
    console.log('Your Wallet:', YOUR_WALLET);
    console.log('Safe Address:', SAFE_ADDRESS);
    console.log('');
    
    // Check some Polymarket position token IDs (they are very large numbers)
    // These are example Polymarket outcome token IDs - they follow a specific pattern
    
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
    
    // Check the Safe first
    console.log('📊 Checking Safe wallet...\n');
    
    // Look for any Transfer events FROM the Safe
    const fromSafeTopics = [
        web3.utils.sha3('TransferSingle(address,address,address,uint256,uint256)'),
        null, // operator
        '0x' + web3.utils.padLeft(SAFE_ADDRESS.slice(2).toLowerCase(), 64), // from (Safe)
        null // to
    ];
    
    try {
        const currentBlock = await web3.eth.getBlockNumber();
        const fromBlock = (currentBlock - BigInt(10000)).toString(); // Last 10k blocks
        
        console.log(`Searching for transfers FROM Safe (last 10k blocks)...\n`);
        
        const logs = await web3.eth.getPastLogs({
            address: ERC1155_CONTRACT,
            topics: fromSafeTopics,
            fromBlock: fromBlock,
            toBlock: 'latest'
        });
        
        if (logs.length > 0) {
            console.log(`Found ${logs.length} transfer(s) from Safe:\n`);
            
            for (const log of logs.slice(-5)) { // Show last 5
                // Parse the log data
                const to = '0x' + log.topics[3].slice(26);
                const tokenIdHex = log.data.slice(0, 66);
                const amountHex = '0x' + log.data.slice(66, 130);
                
                const tokenId = web3.utils.toBN(tokenIdHex);
                const amount = web3.utils.toBN(amountHex);
                
                console.log('Transfer:');
                console.log('  To:', to);
                console.log('  Token ID:', tokenId.toString());
                console.log('  Amount:', amount.toString());
                console.log('  Block:', log.blockNumber);
                console.log('  Tx:', log.transactionHash);
                
                // Check if this token is now in your wallet
                if (to.toLowerCase() === YOUR_WALLET.toLowerCase()) {
                    const currentBalance = await contract.methods.balanceOf(YOUR_WALLET, tokenId.toString()).call();
                    console.log('  ✅ This was transferred to YOUR wallet!');
                    console.log('  Your current balance:', currentBalance);
                    
                    if (currentBalance > 0) {
                        console.log('\n🎯 FOUND YOUR TOKEN!');
                        console.log('================================');
                        console.log('Token ID:', tokenId.toString());
                        console.log('Balance:', currentBalance);
                        console.log('\nTo wrap this token, run:');
                        console.log(`node wrap-1155-now.js ${tokenId.toString()} ${currentBalance}`);
                        console.log('================================\n');
                    }
                }
                console.log('');
            }
        } else {
            console.log('No transfers found from Safe in recent blocks.');
        }
        
        // Also check transfers TO your wallet
        const toYouTopics = [
            web3.utils.sha3('TransferSingle(address,address,address,uint256,uint256)'),
            null, // operator
            null, // from
            '0x' + web3.utils.padLeft(YOUR_WALLET.slice(2).toLowerCase(), 64) // to (your wallet)
        ];
        
        console.log('\nSearching for transfers TO your wallet...\n');
        
        const toYouLogs = await web3.eth.getPastLogs({
            address: ERC1155_CONTRACT,
            topics: toYouTopics,
            fromBlock: fromBlock,
            toBlock: 'latest'
        });
        
        if (toYouLogs.length > 0) {
            console.log(`Found ${toYouLogs.length} transfer(s) to your wallet:\n`);
            
            for (const log of toYouLogs.slice(-5)) { // Show last 5
                const from = '0x' + log.topics[2].slice(26);
                const tokenIdHex = log.data.slice(0, 66);
                const amountHex = '0x' + log.data.slice(66, 130);
                
                const tokenId = web3.utils.toBN(tokenIdHex);
                const amount = web3.utils.toBN(amountHex);
                
                console.log('Transfer:');
                console.log('  From:', from);
                console.log('  Token ID:', tokenId.toString());
                console.log('  Amount:', amount.toString());
                console.log('  Block:', log.blockNumber);
                console.log('  Tx:', log.transactionHash);
                
                // Check current balance
                const currentBalance = await contract.methods.balanceOf(YOUR_WALLET, tokenId.toString()).call();
                console.log('  Current balance:', currentBalance);
                
                if (currentBalance > 0) {
                    console.log('\n🎯 YOU HAVE THIS TOKEN!');
                    console.log('================================');
                    console.log('Token ID:', tokenId.toString());
                    console.log('Balance:', currentBalance);
                    console.log('\nTo wrap this token, run:');
                    console.log(`node wrap-1155-now.js "${tokenId.toString()}" ${currentBalance}`);
                    console.log('================================\n');
                }
                console.log('');
            }
        } else {
            console.log('No transfers to your wallet found in recent blocks.');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

findTokens().catch(console.error);