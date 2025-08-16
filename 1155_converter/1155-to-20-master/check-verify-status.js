const axios = require('axios');
require('dotenv').config();

async function checkStatus() {
    const apiKey = process.env.POLYGONSCAN_API_KEY;
    const guid = process.argv[2] || 'dnfbcpwtysqjsjmlamxxbsqs4r6waafryr9glm1nrjvryphtye';
    const chainId = 137;
    
    console.log('Checking verification status...');
    console.log('GUID:', guid);
    
    try {
        // Check with v2 API
        const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&apikey=${apiKey}&module=contract&action=checkverifystatus&guid=${guid}`;
        
        console.log('Checking v2 API...');
        const response = await axios.get(url);
        
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        if (response.data.status === '1') {
            console.log('✅ Verification successful!');
            console.log('Result:', response.data.result);
        } else if (response.data.result && response.data.result.includes('Pending')) {
            console.log('⏳ Verification pending...');
            console.log('Please wait a moment and try again.');
        } else {
            console.log('Status:', response.data.result || response.data.message);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    console.log('\n📊 Check the contract page:');
    console.log('https://polygonscan.com/address/0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1#code');
}

checkStatus();