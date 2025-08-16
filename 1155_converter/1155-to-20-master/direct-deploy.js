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
        pollingInterval: 8000,
        chainId: 137
    });
    
    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];
    
    console.log('Deploying from account:', deployer);
    
    // Check balance
    const balance = await web3.eth.getBalance(deployer);
    console.log('Account balance:', web3.utils.fromWei(balance, 'ether'), 'MATIC');
    
    if (balance === '0') {
        console.error('No MATIC balance!');
        provider.engine.stop();
        process.exit(1);
    }
    
    // Load contract artifact
    const Wrapped1155Factory = require('./build/contracts/Wrapped1155Factory.json');
    
    // SingletonFactory address (same on all chains)
    const singletonFactoryAddress = '0xce0042B868300000d44A59004Da54A005ffdcf9f';
    
    // Check if SingletonFactory exists
    const code = await web3.eth.getCode(singletonFactoryAddress);
    if (code === '0x' || code === '0x0') {
        console.error('SingletonFactory not deployed on Polygon!');
        provider.engine.stop();
        process.exit(1);
    }
    
    console.log('SingletonFactory found at:', singletonFactoryAddress);
    
    // Build CREATE2 address
    const salt = '0x' + '0'.repeat(64);
    const initCode = Wrapped1155Factory.bytecode;
    
    // Calculate deterministic address
    const initCodeHash = web3.utils.keccak256(initCode);
    const create2Input = web3.utils.encodePacked(
        { t: 'bytes1', v: '0xff' },
        { t: 'address', v: singletonFactoryAddress },
        { t: 'bytes32', v: salt },
        { t: 'bytes32', v: initCodeHash }
    );
    const create2Hash = web3.utils.keccak256(create2Input);
    const expectedAddress = '0x' + create2Hash.slice(-40);
    
    console.log('Expected factory address:', expectedAddress);
    
    // Check if already deployed
    const factoryCode = await web3.eth.getCode(expectedAddress);
    if (factoryCode !== '0x' && factoryCode !== '0x0') {
        console.log('✅ Wrapped1155Factory already deployed!');
        console.log('Contract address:', expectedAddress);
        provider.engine.stop();
        return;
    }
    
    console.log('Deploying Wrapped1155Factory...');
    
    // Deploy via SingletonFactory
    const singletonFactoryABI = [
        {
            "inputs": [
                {"internalType": "bytes", "name": "_initCode", "type": "bytes"},
                {"internalType": "bytes32", "name": "_salt", "type": "bytes32"}
            ],
            "name": "deploy",
            "outputs": [
                {"internalType": "address payable", "name": "createdContract", "type": "address"}
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];
    
    const singletonFactory = new web3.eth.Contract(singletonFactoryABI, singletonFactoryAddress);
    
    try {
        // Estimate gas
        const gasEstimate = await singletonFactory.methods
            .deploy(initCode, salt)
            .estimateGas({ from: deployer });
        
        console.log('Estimated gas:', gasEstimate.toString());
        
        // Get gas price
        const gasPrice = await web3.eth.getGasPrice();
        console.log('Gas price:', web3.utils.fromWei(gasPrice, 'gwei'), 'gwei');
        
        // Deploy
        const tx = await singletonFactory.methods
            .deploy(initCode, salt)
            .send({ 
                from: deployer,
                gas: Number(gasEstimate) * 1.2,
                gasPrice: gasPrice.toString()
            });
        
        console.log('✅ Deployment successful!');
        console.log('Transaction hash:', tx.transactionHash);
        console.log('Wrapped1155Factory deployed at:', expectedAddress);
        
        // Verify deployment
        const deployedCode = await web3.eth.getCode(expectedAddress);
        if (deployedCode !== '0x' && deployedCode !== '0x0') {
            console.log('✅ Contract verified on chain!');
            
            // Get the ERC20 implementation address
            const factoryABI = Wrapped1155Factory.abi;
            const factory = new web3.eth.Contract(factoryABI, expectedAddress);
            const erc20Implementation = await factory.methods.erc20Implementation().call();
            console.log('ERC20 Implementation deployed at:', erc20Implementation);
        }
        
    } catch (error) {
        console.error('Deployment failed:');
        console.error('Error:', error);
        if (error.message) console.error('Message:', error.message);
        if (error.data) console.error('Data:', error.data);
    }
    
    provider.engine.stop();
}

deploy().catch(console.error);