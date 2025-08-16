const { Web3 } = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();

async function deploy() {
    const privateKey = process.env.PRIVATE_KEY;
    const apiKey = process.env.METAMASK_API_KEY;
    
    if (!privateKey || !apiKey) {
        console.error('Missing PRIVATE_KEY or METAMASK_API_KEY in .env');
        process.exit(1);
    }
    
    const provider = new HDWalletProvider({
        privateKeys: [privateKey],
        providerOrUrl: `https://polygon-mainnet.infura.io/v3/${apiKey}`,
        pollingInterval: 8000
    });
    
    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];
    
    console.log('Deploying from account:', deployer);
    
    // Check balance
    const balance = await web3.eth.getBalance(deployer);
    console.log('Account balance:', web3.utils.fromWei(balance, 'ether'), 'MATIC');
    
    if (balance === '0') {
        console.error('No MATIC balance! Please fund your account with MATIC on Polygon network.');
        provider.engine.stop();
        process.exit(1);
    }
    
    // Load contract artifacts
    const Wrapped1155Factory = require('./build/contracts/Wrapped1155Factory.json');
    
    // Check if SingletonFactory exists
    const singletonFactoryAddress = '0xce0042B868300000d44A59004Da54A005ffdcf9f';
    const code = await web3.eth.getCode(singletonFactoryAddress);
    
    if (code === '0x' || code === '0x0') {
        console.log('SingletonFactory not deployed on Polygon. Would need to deploy it first.');
        console.log('This is a one-time deployment that requires special steps.');
    } else {
        console.log('SingletonFactory already deployed at:', singletonFactoryAddress);
    }
    
    // Calculate deterministic address for Wrapped1155Factory
    const salt = '0x' + '0'.repeat(64);
    const bytecode = Wrapped1155Factory.bytecode;
    const hash = web3.utils.keccak256(web3.utils.encodePacked(
        { t: 'bytes', v: '0xff' },
        { t: 'address', v: singletonFactoryAddress },
        { t: 'bytes32', v: salt },
        { t: 'bytes32', v: web3.utils.keccak256(bytecode) }
    ));
    const factoryAddress = '0x' + hash.slice(-40);
    
    console.log('Expected Wrapped1155Factory address:', factoryAddress);
    
    // Check if already deployed
    const factoryCode = await web3.eth.getCode(factoryAddress);
    if (factoryCode !== '0x' && factoryCode !== '0x0') {
        console.log('Wrapped1155Factory already deployed!');
        console.log('Contract address:', factoryAddress);
    } else {
        console.log('Wrapped1155Factory not yet deployed on Polygon.');
        console.log('To deploy, run: npx truffle migrate --network polygon');
    }
    
    provider.engine.stop();
}

deploy().catch(console.error);