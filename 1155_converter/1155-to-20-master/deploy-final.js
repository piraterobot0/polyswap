const { Web3 } = require('web3');
require('dotenv').config();

async function deploy() {
    const privateKey = process.env.PRIVATE_KEY;
    const apiKey = process.env.METAMASK_API_KEY;
    
    if (!privateKey || !apiKey) {
        console.error('Missing PRIVATE_KEY or METAMASK_API_KEY in .env');
        process.exit(1);
    }
    
    // Connect directly without HDWalletProvider
    const web3 = new Web3(`https://polygon-mainnet.infura.io/v3/${apiKey}`);
    
    // Add account from private key
    const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey.replace('0x', ''));
    web3.eth.accounts.wallet.add(account);
    const deployer = account.address;
    
    console.log('Deploying from account:', deployer);
    
    // Check balance
    const balance = await web3.eth.getBalance(deployer);
    console.log('Account balance:', web3.utils.fromWei(balance, 'ether'), 'MATIC');
    
    if (balance === '0' || balance === 0n) {
        console.error('No MATIC balance!');
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
        // Prepare transaction
        const deployMethod = singletonFactory.methods.deploy(initCode, salt);
        
        // Estimate gas
        const gasEstimate = await deployMethod.estimateGas({ from: deployer });
        console.log('Estimated gas:', gasEstimate.toString());
        
        // Get gas price
        const gasPrice = await web3.eth.getGasPrice();
        console.log('Gas price:', web3.utils.fromWei(gasPrice, 'gwei'), 'gwei');
        
        // Get nonce
        const nonce = await web3.eth.getTransactionCount(deployer);
        console.log('Nonce:', nonce);
        
        // Send transaction with explicit configuration
        console.log('Sending transaction...');
        const tx = await deployMethod.send({
            from: deployer,
            gas: Math.floor(Number(gasEstimate) * 1.2),
            gasPrice: gasPrice.toString(),
            nonce: nonce
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
        if (error.message) console.error('Message:', error.message);
        if (error.cause) console.error('Cause:', error.cause);
        if (error.data) console.error('Data:', error.data);
        console.error('Full error:', error);
    }
}

deploy().catch(console.error);