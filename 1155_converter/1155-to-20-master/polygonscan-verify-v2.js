const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

async function verifyContract() {
    const apiKey = process.env.POLYGONSCAN_API_KEY;
    if (!apiKey) {
        console.error('❌ POLYGONSCAN_API_KEY not found in .env');
        return;
    }

    console.log('🔍 Starting Polygonscan verification with multi-chain API...');
    
    // Read cleaned flattened source (single SPDX license)
    const sourceCode = fs.readFileSync('./flattened-clean.sol', 'utf8');
    
    // Contract details
    const contractAddress = '0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1';
    const contractName = 'Wrapped1155Factory';
    const compilerVersion = 'v0.6.12+commit.27d51765';
    const chainId = 137; // Polygon
    
    // Prepare verification request for v2 API
    // Note: chainid must be first in the URL for v2 API
    const params = new URLSearchParams();
    params.append('chainid', chainId);
    params.append('apikey', apiKey);
    params.append('module', 'contract');
    params.append('action', 'verifysourcecode');
    params.append('contractaddress', contractAddress);
    params.append('sourceCode', sourceCode);
    params.append('codeformat', 'solidity-single-file');
    params.append('contractname', contractName);
    params.append('compilerversion', compilerVersion);
    params.append('optimizationUsed', '0'); // No optimization
    params.append('runs', '200');
    params.append('constructorArguements', ''); // No constructor arguments  
    params.append('evmversion', 'istanbul');
    params.append('licenseType', '14'); // LGPL-3.0
    
    try {
        console.log('📤 Submitting verification to Etherscan v2 API...');
        console.log('   Chain ID:', chainId, '(Polygon)');
        console.log('   Contract:', contractAddress);
        console.log('   Name:', contractName);
        console.log('   Compiler:', compilerVersion);
        
        // Use v2 API endpoint with chainid in URL
        const url = `https://api.etherscan.io/v2/api?chainid=${chainId}`;
        
        // Remove chainid from params since it's in URL
        const bodyParams = new URLSearchParams();
        bodyParams.append('apikey', apiKey);
        bodyParams.append('module', 'contract');
        bodyParams.append('action', 'verifysourcecode');
        bodyParams.append('contractaddress', contractAddress);
        bodyParams.append('sourceCode', sourceCode);
        bodyParams.append('codeformat', 'solidity-single-file');
        bodyParams.append('contractname', contractName);
        bodyParams.append('compilerversion', compilerVersion);
        bodyParams.append('optimizationUsed', '0');
        bodyParams.append('runs', '200');
        bodyParams.append('constructorArguements', '');
        bodyParams.append('evmversion', 'istanbul');
        bodyParams.append('licenseType', '14');
        
        const response = await axios.post(
            url,
            bodyParams,
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
                await checkVerificationStatus(apiKey, response.data.result, chainId);
            }, 5000);
            
        } else {
            console.log('❌ Verification response:');
            console.log('   Message:', response.data.result || response.data.message);
            
            if (response.data.result && response.data.result.includes('already verified')) {
                console.log('\n✅ Contract is already verified!');
                console.log(`   View at: https://polygonscan.com/address/${contractAddress}#code`);
            }
            
            // Try alternative endpoint if v2 fails
            if (response.data.message && response.data.message.includes('Invalid')) {
                console.log('\n🔄 Trying alternative endpoint...');
                await tryAlternativeVerification(apiKey, contractAddress, contractName, compilerVersion, sourceCode);
            }
        }
        
    } catch (error) {
        console.error('❌ Error during verification:');
        console.error(error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
        
        // Try alternative if main fails
        console.log('\n🔄 Trying alternative verification method...');
        await tryAlternativeVerification(apiKey, contractAddress, contractName, compilerVersion, sourceCode);
    }
}

async function tryAlternativeVerification(apiKey, contractAddress, contractName, compilerVersion, sourceCode) {
    // Try with standard Polygonscan API (some multi-chain keys work both ways)
    const params = new URLSearchParams({
        apikey: apiKey,
        module: 'contract',
        action: 'verifysourcecode',
        contractaddress: contractAddress,
        sourceCode: sourceCode,
        codeformat: 'solidity-single-file',
        contractname: contractName,
        compilerversion: compilerVersion,
        optimizationUsed: 0,
        runs: 200,
        constructorArguements: '',
        evmversion: 'istanbul',
        licenseType: 14,
    });
    
    try {
        const response = await axios.post(
            'https://api.polygonscan.com/api',
            params,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            }
        );
        
        if (response.data.status === '1') {
            console.log('✅ Verification request submitted via Polygonscan API!');
            console.log('   GUID:', response.data.result);
        } else {
            console.log('Alternative method response:', response.data.result);
        }
    } catch (error) {
        console.log('Alternative method also failed:', error.message);
    }
}

async function checkVerificationStatus(apiKey, guid, chainId) {
    try {
        // Use v2 API with chainid in URL
        const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&apikey=${apiKey}&module=contract&action=checkverifystatus&guid=${guid}`;
        
        let response = await axios.get(url);
        
        // If v2 fails, try standard Polygonscan
        if (!response.data || response.data.message === 'NOTOK') {
            response = await axios.get('https://api.polygonscan.com/api', {
                params: {
                    apikey: apiKey,
                    module: 'contract',
                    action: 'checkverifystatus',
                    guid: guid
                }
            });
        }
        
        console.log('\n📋 Verification Status:');
        if (response.data.status === '1') {
            console.log('   ✅', response.data.result);
        } else {
            console.log('   ⏳', response.data.result || response.data.message);
            console.log('   (This may take a few minutes. Check the link above.)');
        }
    } catch (error) {
        console.error('Could not check status:', error.message);
    }
}

verifyContract();