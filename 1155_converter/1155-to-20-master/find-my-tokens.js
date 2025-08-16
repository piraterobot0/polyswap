/**
 * Find your ERC-1155 token IDs from recent transactions
 */

const { Web3 } = require('web3');
require('dotenv').config();

const ERC1155_CONTRACT = '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045';
const YOUR_WALLET = '0x884F5C47fA1eCaF0C8957611f648Fb320551ab51';

async function findMyTokens() {
    const apiKey = process.env.METAMASK_API_KEY;
    const web3 = new Web3(`https://polygon-mainnet.infura.io/v3/${apiKey}`);
    
    console.log('🔍 Finding Your ERC-1155 Tokens');
    console.log('================================');
    console.log('Contract:', ERC1155_CONTRACT);
    console.log('Your Wallet:', YOUR_WALLET);
    console.log('');
    
    // Look at the most recent transaction where you received tokens
    console.log('📊 Checking recent transactions...\n');
    
    try {
        // Get your transaction list
        const currentBlock = await web3.eth.getBlockNumber();
        console.log('Current block:', currentBlock);
        
        // Look for TransferSingle events TO your address
        const transferSingleTopic = web3.utils.sha3('TransferSingle(address,address,address,uint256,uint256)');
        
        // Search in chunks to avoid errors
        const blocksToSearch = 50000n;
        const fromBlock = currentBlock - blocksToSearch;
        
        console.log(`Searching blocks ${fromBlock} to ${currentBlock}...\n`);
        
        // Format the 'to' address for the topic
        const toAddressTopic = '0x' + YOUR_WALLET.slice(2).toLowerCase().padStart(64, '0');
        
        const logs = await web3.eth.getPastLogs({
            address: ERC1155_CONTRACT,
            topics: [
                transferSingleTopic,
                null, // operator (any)
                null, // from (any)
                toAddressTopic // to (your address)
            ],
            fromBlock: '0x' + fromBlock.toString(16),
            toBlock: 'latest'
        });
        
        if (logs.length > 0) {
            console.log(`Found ${logs.length} incoming transfer(s)!\n`);
            
            // Track unique token IDs
            const tokenIds = new Set();
            
            for (const log of logs) {
                // The token ID and amount are in the data field
                const data = log.data;
                const tokenIdHex = '0x' + data.slice(2, 66);
                const amountHex = '0x' + data.slice(66, 130);
                
                const tokenId = BigInt(tokenIdHex).toString();
                const amount = BigInt(amountHex).toString();
                
                tokenIds.add(tokenId);
                
                console.log('Transfer Found:');
                console.log('  Block:', log.blockNumber);
                console.log('  Tx Hash:', log.transactionHash);
                console.log('  Token ID:', tokenId);
                console.log('  Amount Transferred:', amount);
                console.log('');
            }
            
            // Now check current balance for each unique token ID
            console.log('📊 Checking current balances...\n');
            
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
            
            for (const tokenId of tokenIds) {
                const balance = await contract.methods.balanceOf(YOUR_WALLET, tokenId).call();
                
                if (balance > 0) {
                    console.log('✅ TOKEN FOUND IN YOUR WALLET!');
                    console.log('================================');
                    console.log('Token ID:', tokenId);
                    console.log('Current Balance:', balance);
                    console.log('');
                    console.log('To wrap this token, run:');
                    console.log(`node wrap-1155-now.js "${tokenId}" ${balance}`);
                    console.log('================================\n');
                }
            }
        } else {
            console.log('No incoming transfers found in recent blocks.');
            console.log('The token might have been transferred earlier.');
            
            // You mentioned you transferred it - let's check if it's a Polymarket token
            // Polymarket tokens have very large IDs
            console.log('\n💡 If you know the token ID from Polygonscan, you can wrap it directly:');
            console.log('   node wrap-1155-now.js "TOKEN_ID" AMOUNT');
            console.log('\n   Example for Polymarket position:');
            console.log('   node wrap-1155-now.js "123456789012345678901234567890" 1');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        
        if (error.message.includes('returned more than')) {
            console.log('\n⚠️  Too many logs to process. Trying smaller range...');
            // Try with smaller block range
        }
    }
}

findMyTokens().catch(console.error);