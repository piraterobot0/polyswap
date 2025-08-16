/**
 * Check ERC-1155 token metadata and embedded information
 */

const { Web3 } = require('web3');
require('dotenv').config();

const ERC1155_CONTRACT = '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045';
const TOKEN_ID = '106277356443369138797049499065953438334187241175412976556484145976288075138631';

async function checkTokenMetadata() {
    const apiKey = process.env.METAMASK_API_KEY;
    const web3 = new Web3(`https://polygon-mainnet.infura.io/v3/${apiKey}`);
    
    console.log('🔍 Checking ERC-1155 Token Metadata');
    console.log('=====================================');
    console.log('Contract:', ERC1155_CONTRACT);
    console.log('Token ID:', TOKEN_ID);
    console.log('');
    
    // Common ERC-1155 metadata methods
    const metadataABI = [
        // Standard ERC-1155 URI method
        {
            "inputs": [{"name": "id", "type": "uint256"}],
            "name": "uri",
            "outputs": [{"name": "", "type": "string"}],
            "type": "function",
            "constant": true
        },
        // Some contracts have a name
        {
            "inputs": [],
            "name": "name",
            "outputs": [{"name": "", "type": "string"}],
            "type": "function",
            "constant": true
        },
        // Some contracts have a symbol
        {
            "inputs": [],
            "name": "symbol",
            "outputs": [{"name": "", "type": "string"}],
            "type": "function",
            "constant": true
        },
        // Polymarket might have outcome names
        {
            "inputs": [{"name": "tokenId", "type": "uint256"}],
            "name": "getOutcomeName",
            "outputs": [{"name": "", "type": "string"}],
            "type": "function",
            "constant": true
        },
        // Check for market information
        {
            "inputs": [{"name": "tokenId", "type": "uint256"}],
            "name": "getMarket",
            "outputs": [{"name": "", "type": "address"}],
            "type": "function",
            "constant": true
        }
    ];
    
    const contract = new web3.eth.Contract(metadataABI, ERC1155_CONTRACT);
    
    console.log('📊 Checking contract methods...\n');
    
    // Try to get URI
    try {
        const uri = await contract.methods.uri(TOKEN_ID).call();
        console.log('✅ Token URI:', uri);
        
        // If URI contains {id}, replace it with the actual token ID
        if (uri.includes('{id}')) {
            const hexId = '0x' + BigInt(TOKEN_ID).toString(16).padStart(64, '0');
            const actualUri = uri.replace('{id}', hexId);
            console.log('   Actual URI:', actualUri);
            
            // If it's an IPFS URI, show the gateway URL
            if (actualUri.includes('ipfs://')) {
                const httpUrl = actualUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
                console.log('   IPFS Gateway:', httpUrl);
            }
        }
        console.log('');
    } catch (e) {
        console.log('❌ No uri() method or failed to call');
    }
    
    // Try to get contract name
    try {
        const name = await contract.methods.name().call();
        console.log('✅ Contract Name:', name);
    } catch (e) {
        console.log('❌ No name() method');
    }
    
    // Try to get contract symbol
    try {
        const symbol = await contract.methods.symbol().call();
        console.log('✅ Contract Symbol:', symbol);
    } catch (e) {
        console.log('❌ No symbol() method');
    }
    
    // For Polymarket tokens, let's decode the token ID
    console.log('\n📐 Analyzing Token ID Structure...\n');
    
    const tokenIdBigInt = BigInt(TOKEN_ID);
    const tokenIdHex = '0x' + tokenIdBigInt.toString(16);
    
    console.log('Token ID (decimal):', TOKEN_ID);
    console.log('Token ID (hex):', tokenIdHex);
    console.log('Token ID (hex length):', tokenIdHex.length - 2, 'characters');
    
    // Polymarket token IDs are often derived from:
    // - Market/condition ID (bytes32)
    // - Outcome index
    // Let's try to decode it
    
    if (tokenIdHex.length === 66) { // 32 bytes
        console.log('\n🔍 This appears to be a 32-byte identifier');
        
        // Try to split it into components
        // First 31 bytes might be condition/market ID
        // Last byte might be outcome
        const possibleMarketId = tokenIdHex.slice(0, 64);
        const possibleOutcome = tokenIdHex.slice(64);
        
        console.log('Possible Market ID:', possibleMarketId);
        console.log('Possible Outcome:', '0x' + possibleOutcome);
        
        // Convert outcome to number
        if (possibleOutcome) {
            const outcomeNum = parseInt(possibleOutcome, 16);
            console.log('Outcome as number:', outcomeNum);
            
            // Common outcome mappings
            if (outcomeNum === 0) console.log('   → This might be "No" or "False"');
            if (outcomeNum === 1) console.log('   → This might be "Yes" or "True"');
            if (outcomeNum === 47) console.log('   → Outcome #47');
        }
    }
    
    // Check the contract bytecode to identify the contract type
    console.log('\n🔍 Checking contract type...\n');
    
    const code = await web3.eth.getCode(ERC1155_CONTRACT);
    console.log('Contract deployed:', code !== '0x' ? '✅ Yes' : '❌ No');
    console.log('Bytecode size:', code.length, 'characters');
    
    // Common Polymarket contract addresses
    const KNOWN_CONTRACTS = {
        '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045': 'Polymarket CTF Exchange',
        '0x7c27269a5598658b19e0fab4f04a0d920f8ec2c7': 'Polymarket V1',
        '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E': 'Polymarket Conditional Tokens'
    };
    
    if (KNOWN_CONTRACTS[ERC1155_CONTRACT]) {
        console.log('✅ Identified as:', KNOWN_CONTRACTS[ERC1155_CONTRACT]);
    }
    
    console.log('\n💡 Suggestions for naming your wrapped token:');
    console.log('================================');
    console.log('Based on the contract being Polymarket:');
    console.log('');
    console.log('For a YES position:');
    console.log('  Name: "Polymarket YES Position"');
    console.log('  Symbol: "pmYES"');
    console.log('');
    console.log('For a NO position:');
    console.log('  Name: "Polymarket NO Position"');  
    console.log('  Symbol: "pmNO"');
    console.log('');
    console.log('For a specific market (if you know it):');
    console.log('  Name: "PM Trump Election YES"');
    console.log('  Symbol: "TRUMP-Y"');
    console.log('');
    console.log('Generic wrapper:');
    console.log('  Name: "Polymarket Position ' + TOKEN_ID.slice(-6) + '"');
    console.log('  Symbol: "PM-' + TOKEN_ID.slice(-6) + '"');
    
    // Try to fetch metadata from URI if it exists
    try {
        const uri = await contract.methods.uri(TOKEN_ID).call();
        if (uri && uri.startsWith('http')) {
            console.log('\n📥 Fetching metadata from URI...');
            // Note: This would require an HTTP request which we can't do directly here
            console.log('   URI:', uri);
            console.log('   You can visit this URL to see the metadata');
        }
    } catch (e) {
        // Silent fail
    }
}

checkTokenMetadata().catch(console.error);