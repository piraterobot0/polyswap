const { Web3 } = require('web3');
require('dotenv').config();

async function checkDeployment() {
    const apiKey = process.env.METAMASK_API_KEY;
    
    // Use HTTPS provider (no wallet needed for read-only)
    const web3 = new Web3(`https://polygon-mainnet.infura.io/v3/${apiKey}`);
    
    // Known deployed address from Gnosis deployment
    const knownFactoryAddress = web3.utils.toChecksumAddress('0xd7AcD2a9FD159E69Bb102A1ca21C9a3e3A5F771B');
    
    console.log('Checking known Wrapped1155Factory deployment...');
    console.log('Address:', knownFactoryAddress);
    
    // Check if contract exists
    const code = await web3.eth.getCode(knownFactoryAddress);
    if (code !== '0x' && code !== '0x0') {
        console.log('✅ Wrapped1155Factory is already deployed on Polygon!');
        console.log('Contract size:', code.length, 'characters');
        
        // Load ABI and check implementation
        const Wrapped1155Factory = require('./build/contracts/Wrapped1155Factory.json');
        const factory = new web3.eth.Contract(Wrapped1155Factory.abi, knownFactoryAddress);
        
        try {
            const erc20Implementation = await factory.methods.erc20Implementation().call();
            console.log('ERC20 Implementation:', erc20Implementation);
            
            // You can use this deployed factory!
            console.log('\n📝 To use this factory:');
            console.log('1. Call onERC1155Received when sending ERC-1155 tokens to wrap them');
            console.log('2. Call unwrap to convert wrapped ERC-20 back to ERC-1155');
            console.log('3. Factory address:', knownFactoryAddress);
            
        } catch (e) {
            console.log('Could not read implementation address');
        }
    } else {
        console.log('❌ No contract found at this address');
    }
    
    // Also check our calculated address
    const ourCalculatedAddress = web3.utils.toChecksumAddress('0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1');
    console.log('\nChecking our calculated address:', ourCalculatedAddress);
    const ourCode = await web3.eth.getCode(ourCalculatedAddress);
    if (ourCode !== '0x' && ourCode !== '0x0') {
        console.log('✅ Factory found at our calculated address!');
        console.log('Contract size:', ourCode.length, 'characters');
    } else {
        console.log('❌ Not deployed at our calculated address either');
        console.log('\n📌 The Wrapped1155Factory needs to be deployed on Polygon');
        console.log('Expected address after deployment:', ourCalculatedAddress);
    }
}

checkDeployment().catch(console.error);