const Web3 = require('web3');
const path = require('path');
// Load local .env first, then fallback to 1155_converter .env
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
if (!process.env.PRIVATE_KEY) {
    require('dotenv').config({ path: path.resolve(__dirname, '../1155_converter/1155-to-20-master/.env') });
}

const ERC1155_ABI = [
    {
        "inputs": [
            {"name": "from", "type": "address"},
            {"name": "to", "type": "address"},
            {"name": "id", "type": "uint256"},
            {"name": "amount", "type": "uint256"},
            {"name": "data", "type": "bytes"}
        ],
        "name": "safeTransferFrom",
        "outputs": [],
        "type": "function"
    },
    {
        "inputs": [
            {"name": "from", "type": "address"},
            {"name": "to", "type": "address"},
            {"name": "ids", "type": "uint256[]"},
            {"name": "amounts", "type": "uint256[]"},
            {"name": "data", "type": "bytes"}
        ],
        "name": "safeBatchTransferFrom",
        "outputs": [],
        "type": "function"
    },
    {
        "inputs": [
            {"name": "account", "type": "address"},
            {"name": "id", "type": "uint256"}
        ],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {"name": "accounts", "type": "address[]"},
            {"name": "ids", "type": "uint256[]"}
        ],
        "name": "balanceOfBatch",
        "outputs": [{"name": "", "type": "uint256[]"}],
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {"name": "operator", "type": "address"},
            {"name": "approved", "type": "bool"}
        ],
        "name": "setApprovalForAll",
        "outputs": [],
        "type": "function"
    },
    {
        "inputs": [
            {"name": "account", "type": "address"},
            {"name": "operator", "type": "address"}
        ],
        "name": "isApprovedForAll",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function",
        "constant": true
    }
];

class ERC1155Transfer {
    constructor(rpcUrl, privateKey) {
        this.web3 = new Web3(rpcUrl);
        this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
        this.web3.eth.accounts.wallet.add(this.account);
        this.web3.eth.defaultAccount = this.account.address;
    }

    async transferSingle(tokenAddress, fromAddress, toAddress, tokenId, amount) {
        try {
            const contract = new this.web3.eth.Contract(ERC1155_ABI, tokenAddress);
            
            // Check balance
            const balance = await contract.methods.balanceOf(fromAddress, tokenId).call();
            console.log(`Current balance of token ${tokenId}: ${balance}`);
            
            if (parseInt(balance) < parseInt(amount)) {
                throw new Error(`Insufficient balance. Available: ${balance}, Requested: ${amount}`);
            }

            // Check if we're the owner or have approval
            if (fromAddress.toLowerCase() !== this.account.address.toLowerCase()) {
                const isApproved = await contract.methods.isApprovedForAll(fromAddress, this.account.address).call();
                if (!isApproved) {
                    throw new Error(`Not approved to transfer from this address. Executing wallet: ${this.account.address}, From address: ${fromAddress}`);
                }
            }

            const gasPrice = await this.web3.eth.getGasPrice();
            const data = '0x';
            
            const tx = contract.methods.safeTransferFrom(
                fromAddress,
                toAddress,
                tokenId,
                amount,
                data
            );

            const gas = await tx.estimateGas({ from: this.account.address });
            
            console.log(`Transferring ${amount} of token ${tokenId} from ${fromAddress} to ${toAddress}`);
            
            const receipt = await tx.send({
                from: this.account.address,
                gas: Math.floor(gas * 1.2),
                gasPrice: gasPrice
            });

            console.log('Transfer successful!');
            console.log('Transaction hash:', receipt.transactionHash);
            return receipt;

        } catch (error) {
            console.error('Transfer failed:', error.message);
            throw error;
        }
    }

    async transferBatch(tokenAddress, fromAddress, toAddress, tokenIds, amounts) {
        try {
            const contract = new this.web3.eth.Contract(ERC1155_ABI, tokenAddress);
            
            // Check all balances
            for (let i = 0; i < tokenIds.length; i++) {
                const balance = await contract.methods.balanceOf(fromAddress, tokenIds[i]).call();
                console.log(`Token ${tokenIds[i]} balance: ${balance}`);
                
                if (parseInt(balance) < parseInt(amounts[i])) {
                    throw new Error(`Insufficient balance for token ${tokenIds[i]}. Available: ${balance}, Requested: ${amounts[i]}`);
                }
            }

            // Check if we're the owner or have approval
            if (fromAddress.toLowerCase() !== this.account.address.toLowerCase()) {
                const isApproved = await contract.methods.isApprovedForAll(fromAddress, this.account.address).call();
                if (!isApproved) {
                    throw new Error(`Not approved to transfer from this address. Executing wallet: ${this.account.address}, From address: ${fromAddress}`);
                }
            }

            const gasPrice = await this.web3.eth.getGasPrice();
            const data = '0x';
            
            const tx = contract.methods.safeBatchTransferFrom(
                fromAddress,
                toAddress,
                tokenIds,
                amounts,
                data
            );

            const gas = await tx.estimateGas({ from: this.account.address });
            
            console.log(`Batch transferring ${tokenIds.length} tokens from ${fromAddress} to ${toAddress}`);
            
            const receipt = await tx.send({
                from: this.account.address,
                gas: Math.floor(gas * 1.2),
                gasPrice: gasPrice
            });

            console.log('Batch transfer successful!');
            console.log('Transaction hash:', receipt.transactionHash);
            return receipt;

        } catch (error) {
            console.error('Batch transfer failed:', error.message);
            throw error;
        }
    }

    async transferAll(tokenAddress, fromAddress, toAddress, tokenIds) {
        try {
            const contract = new this.web3.eth.Contract(ERC1155_ABI, tokenAddress);
            
            // Get all balances
            const amounts = [];
            for (const tokenId of tokenIds) {
                const balance = await contract.methods.balanceOf(fromAddress, tokenId).call();
                console.log(`Token ${tokenId} balance: ${balance}`);
                
                if (parseInt(balance) > 0) {
                    amounts.push(balance);
                } else {
                    console.log(`Skipping token ${tokenId} - zero balance`);
                }
            }

            if (amounts.length === 0) {
                console.log('No tokens to transfer');
                return null;
            }

            // Filter out zero balances
            const nonZeroTokenIds = [];
            const nonZeroAmounts = [];
            for (let i = 0; i < tokenIds.length; i++) {
                const balance = await contract.methods.balanceOf(fromAddress, tokenIds[i]).call();
                if (parseInt(balance) > 0) {
                    nonZeroTokenIds.push(tokenIds[i]);
                    nonZeroAmounts.push(balance);
                }
            }

            if (nonZeroTokenIds.length === 0) {
                console.log('No tokens with balance to transfer');
                return null;
            }

            return await this.transferBatch(tokenAddress, fromAddress, toAddress, nonZeroTokenIds, nonZeroAmounts);

        } catch (error) {
            console.error('Transfer all failed:', error.message);
            throw error;
        }
    }

    async checkBalance(tokenAddress, accountAddress, tokenId) {
        try {
            const contract = new this.web3.eth.Contract(ERC1155_ABI, tokenAddress);
            const balance = await contract.methods.balanceOf(accountAddress, tokenId).call();
            console.log(`Balance of token ${tokenId} for ${accountAddress}: ${balance}`);
            return balance;
        } catch (error) {
            console.error('Failed to check balance:', error.message);
            throw error;
        }
    }

    async setApproval(tokenAddress, operatorAddress, approved) {
        try {
            const contract = new this.web3.eth.Contract(ERC1155_ABI, tokenAddress);
            
            const gasPrice = await this.web3.eth.getGasPrice();
            const tx = contract.methods.setApprovalForAll(operatorAddress, approved);
            const gas = await tx.estimateGas({ from: this.account.address });
            
            console.log(`Setting approval for ${operatorAddress}: ${approved}`);
            
            const receipt = await tx.send({
                from: this.account.address,
                gas: Math.floor(gas * 1.2),
                gasPrice: gasPrice
            });

            console.log('Approval set successfully!');
            console.log('Transaction hash:', receipt.transactionHash);
            return receipt;

        } catch (error) {
            console.error('Failed to set approval:', error.message);
            throw error;
        }
    }
}

// Example usage
async function main() {
    // Configuration
    const RPC_URL = process.env.POLYGON_INFURA || 'https://polygon-rpc.com/';
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    
    // Get addresses from command line arguments
    const TOKEN_CONTRACT = process.argv[3];
    const FROM_ADDRESS = process.argv[4];
    const TO_ADDRESS = process.argv[5];
    
    if (!PRIVATE_KEY) {
        console.error('Please set PRIVATE_KEY in .env file');
        process.exit(1);
    }

    const transfer = new ERC1155Transfer(RPC_URL, PRIVATE_KEY);

    // Example: Transfer single token
    if (process.argv[2] === 'single') {
        if (!TOKEN_CONTRACT || !FROM_ADDRESS || !TO_ADDRESS) {
            console.error('Missing required arguments');
            console.log('Usage: node transfer-1155.js single <tokenContract> <fromAddress> <toAddress> <tokenId> [amount]');
            process.exit(1);
        }
        const tokenId = process.argv[6];
        const amount = process.argv[7] || '1';
        await transfer.transferSingle(TOKEN_CONTRACT, FROM_ADDRESS, TO_ADDRESS, tokenId, amount);
    }
    
    // Example: Transfer batch
    else if (process.argv[2] === 'batch') {
        if (!TOKEN_CONTRACT || !FROM_ADDRESS || !TO_ADDRESS) {
            console.error('Missing required arguments');
            console.log('Usage: node transfer-1155.js batch <tokenContract> <fromAddress> <toAddress> <tokenId1,tokenId2> <amount1,amount2>');
            process.exit(1);
        }
        const tokenIds = process.argv[6].split(',');
        const amounts = process.argv[7].split(',');
        await transfer.transferBatch(TOKEN_CONTRACT, FROM_ADDRESS, TO_ADDRESS, tokenIds, amounts);
    }
    
    // Example: Transfer all tokens
    else if (process.argv[2] === 'all') {
        if (!TOKEN_CONTRACT || !FROM_ADDRESS || !TO_ADDRESS) {
            console.error('Missing required arguments');
            console.log('Usage: node transfer-1155.js all <tokenContract> <fromAddress> <toAddress> <tokenId1,tokenId2,...>');
            process.exit(1);
        }
        const tokenIds = process.argv[6].split(',');
        await transfer.transferAll(TOKEN_CONTRACT, FROM_ADDRESS, TO_ADDRESS, tokenIds);
    }
    
    // Example: Check balance
    else if (process.argv[2] === 'balance') {
        const tokenContract = process.argv[3];
        const address = process.argv[4];
        const tokenId = process.argv[5];
        if (!tokenContract || !address || !tokenId) {
            console.error('Missing required arguments');
            console.log('Usage: node transfer-1155.js balance <tokenContract> <address> <tokenId>');
            process.exit(1);
        }
        await transfer.checkBalance(tokenContract, address, tokenId);
    }
    
    // Example: Set approval
    else if (process.argv[2] === 'approve') {
        const tokenContract = process.argv[3];
        const operator = process.argv[4];
        const approved = process.argv[5] !== 'false';
        if (!tokenContract || !operator) {
            console.error('Missing required arguments');
            console.log('Usage: node transfer-1155.js approve <tokenContract> <operatorAddress> [true/false]');
            process.exit(1);
        }
        await transfer.setApproval(tokenContract, operator, approved);
    }
    
    else {
        console.log('Usage:');
        console.log('  node transfer-1155.js single <tokenContract> <fromAddress> <toAddress> <tokenId> [amount]');
        console.log('  node transfer-1155.js batch <tokenContract> <fromAddress> <toAddress> <tokenId1,tokenId2> <amount1,amount2>');
        console.log('  node transfer-1155.js all <tokenContract> <fromAddress> <toAddress> <tokenId1,tokenId2,...>');
        console.log('  node transfer-1155.js balance <tokenContract> <address> <tokenId>');
        console.log('  node transfer-1155.js approve <tokenContract> <operatorAddress> [true/false]');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ERC1155Transfer;