const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

async function verifyContract() {
    const apiKey = process.env.POLYGONSCAN_API_KEY;
    if (!apiKey) {
        console.error('❌ POLYGONSCAN_API_KEY not found in .env');
        return;
    }

    console.log('🔍 Starting Polygonscan verification...');
    
    // Read flattened source
    const sourceCode = fs.readFileSync('./flattened.sol', 'utf8');
    
    // Contract details
    const contractAddress = '0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1';
    const contractName = 'Wrapped1155Factory';
    const compilerVersion = 'v0.6.12+commit.27d51765';
    
    // Prepare verification request
    const params = {
        apikey: apiKey,
        module: 'contract',
        action: 'verifysourcecode',
        contractaddress: contractAddress,
        sourceCode: sourceCode,
        codeformat: 'solidity-single-file',
        contractname: contractName,
        compilerversion: compilerVersion,
        optimizationUsed: 0, // No optimization
        runs: 200,
        constructorArguements: '', // No constructor arguments
        evmversion: 'istanbul',
        licenseType: 14, // LGPL-3.0
    };
    
    try {
        console.log('📤 Submitting verification to Polygonscan...');
        console.log('   Contract:', contractAddress);
        console.log('   Name:', contractName);
        console.log('   Compiler:', compilerVersion);
        
        const response = await axios.post(
            'https://api.polygonscan.com/api',
            new URLSearchParams(params),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            }
        );
        
        if (response.data.status === '1') {
            console.log('✅ Verification request submitted successfully!');
            console.log('   GUID:', response.data.result);
            console.log('\n📊 Check verification status:');
            console.log(`   https://polygonscan.com/address/${contractAddress}#code`);
            
            // Check status after a delay
            setTimeout(async () => {
                await checkVerificationStatus(apiKey, response.data.result);
            }, 5000);
            
        } else {
            console.log('❌ Verification failed:');
            console.log('   Message:', response.data.result);
            
            if (response.data.result.includes('already verified')) {
                console.log('\n✅ Contract is already verified!');
                console.log(`   View at: https://polygonscan.com/address/${contractAddress}#code`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error during verification:');
        console.error(error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

async function checkVerificationStatus(apiKey, guid) {
    try {
        const response = await axios.get('https://api.polygonscan.com/api', {
            params: {
                apikey: apiKey,
                module: 'contract',
                action: 'checkverifystatus',
                guid: guid
            }
        });
        
        console.log('\n📋 Verification Status:');
        if (response.data.status === '1') {
            console.log('   ✅', response.data.result);
        } else {
            console.log('   ⏳', response.data.result);
            console.log('   (This may take a few minutes. Check the link above.)');
        }
    } catch (error) {
        console.error('Could not check status:', error.message);
    }
}

// Check if axios is installed
try {
    require.resolve('axios');
    verifyContract();
} catch (e) {
    console.log('Installing axios...');
    require('child_process').execSync('npm install axios', { stdio: 'inherit' });
    console.log('Please run this script again.');
}