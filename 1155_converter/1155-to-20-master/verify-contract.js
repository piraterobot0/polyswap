const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('POLYGONSCAN VERIFICATION INSTRUCTIONS');
console.log('='.repeat(60));

console.log('\n📝 CONTRACT INFORMATION:');
console.log('   Factory Address: 0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1');
console.log('   Contract Name: Wrapped1155Factory');
console.log('   Compiler Version: v0.6.12+commit.27d51765');
console.log('   Optimization: Enabled (200 runs)');
console.log('   License: LGPL-3.0-or-later');

console.log('\n📋 VERIFICATION STEPS:');
console.log('\n1. Get a Polygonscan API key:');
console.log('   - Go to https://polygonscan.com/register');
console.log('   - Create an account and get an API key');
console.log('   - Add it to your .env file as POLYGONSCAN_API_KEY');

console.log('\n2. Manual Verification (Recommended):');
console.log('   - Go to https://polygonscan.com/verifyContract');
console.log('   - Enter Contract Address: 0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1');
console.log('   - Select "Single File" verification');
console.log('   - Compiler Type: Solidity (Single file)');
console.log('   - Compiler Version: v0.6.12+commit.27d51765');
console.log('   - Open Source License: LGPL-3.0-or-later');
console.log('   - Optimization: Yes, 200 runs');
console.log('   - Copy the contents of "flattened.sol" file');
console.log('   - No constructor arguments needed');

console.log('\n3. Automated Verification (After adding API key):');
console.log('   Run: npx truffle run verify Wrapped1155Factory --network polygon --license LGPL-3.0-or-later');

console.log('\n📂 Files Created:');
console.log('   - flattened.sol: Flattened source code for manual verification');

console.log('\n⚠️  IMPORTANT NOTES:');
console.log('   - The contract was deployed via CREATE2, not regular deployment');
console.log('   - You may need to verify it as "Similar Match" if exact match fails');
console.log('   - The ERC20 Implementation at 0xf67438Cb870c911319cd4da95d064A6B4772081C');
console.log('     will also need separate verification');

console.log('\n' + '='.repeat(60));

// Check compiler settings from truffle-config
console.log('\n📊 Checking Truffle Compiler Settings...');
try {
    const truffleConfig = require('./truffle-config.js');
    if (truffleConfig.compilers && truffleConfig.compilers.solc) {
        console.log('   Version:', truffleConfig.compilers.solc.version || '0.6.12');
        console.log('   Optimizer:', truffleConfig.compilers.solc.optimizer ? 'Enabled' : 'Disabled');
        if (truffleConfig.compilers.solc.optimizer) {
            console.log('   Runs:', truffleConfig.compilers.solc.optimizer.runs || 200);
        }
    }
} catch (e) {
    console.log('   Could not read truffle config');
}

// Check if flattened file exists
if (fs.existsSync('./flattened.sol')) {
    const stats = fs.statSync('./flattened.sol');
    console.log('\n✅ Flattened source ready:');
    console.log('   File: flattened.sol');
    console.log('   Size:', stats.size, 'bytes');
} else {
    console.log('\n⚠️  Flattened source not found. Run:');
    console.log('   npx truffle-flattener contracts/Wrapped1155Factory.sol > flattened.sol');
}

console.log('\n' + '='.repeat(60));