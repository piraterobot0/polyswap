const { Web3 } = require('web3');
require('dotenv').config();

async function verify() {
    const apiKey = process.env.METAMASK_API_KEY;
    const web3 = new Web3(`https://polygon-mainnet.infura.io/v3/${apiKey}`);
    
    const txHash = '0xd4d7688960b047fa215414412f50eddff708ca3a55071ffb958c1d6ef93c8123';
    console.log('Checking transaction:', txHash);
    
    // Get transaction receipt
    const receipt = await web3.eth.getTransactionReceipt(txHash);
    console.log('\nTransaction Receipt:');
    console.log('Status:', receipt.status ? 'Success' : 'Failed');
    console.log('From:', receipt.from);
    console.log('To:', receipt.to);
    console.log('Contract Address:', receipt.contractAddress);
    console.log('Gas Used:', receipt.gasUsed.toString());
    
    // Check logs
    if (receipt.logs && receipt.logs.length > 0) {
        console.log('\nLogs:');
        receipt.logs.forEach((log, i) => {
            console.log(`Log ${i}:`, {
                address: log.address,
                topics: log.topics,
                data: log.data
            });
        });
    }
    
    // Check the expected addresses
    const expectedFactoryAddress = '0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1';
    const singletonFactoryAddress = '0xce0042B868300000d44A59004Da54A005ffdcf9f';
    
    console.log('\nChecking contract deployments:');
    
    // Check SingletonFactory
    const singletonCode = await web3.eth.getCode(singletonFactoryAddress);
    console.log('SingletonFactory:', singletonCode !== '0x' ? '✅ Deployed' : '❌ Not found');
    
    // Check expected factory address
    const factoryCode = await web3.eth.getCode(expectedFactoryAddress);
    console.log('Wrapped1155Factory at expected address:', factoryCode !== '0x' ? '✅ Deployed' : '❌ Not found');
    
    if (factoryCode !== '0x') {
        console.log('Factory code length:', factoryCode.length);
        
        // Try to interact with it
        const Wrapped1155Factory = require('./build/contracts/Wrapped1155Factory.json');
        const factory = new web3.eth.Contract(Wrapped1155Factory.abi, expectedFactoryAddress);
        
        try {
            const impl = await factory.methods.erc20Implementation().call();
            console.log('ERC20 Implementation address:', impl);
            
            // Check implementation
            const implCode = await web3.eth.getCode(impl);
            console.log('Implementation deployed:', implCode !== '0x' ? '✅ Yes' : '❌ No');
        } catch (e) {
            console.log('Error reading from factory:', e.message);
        }
    }
    
    // Check if any contract was created in the transaction
    if (receipt.contractAddress) {
        console.log('\n⚠️ Contract was deployed at:', receipt.contractAddress);
        console.log('This might be different from expected address');
    }
}

verify().catch(console.error);