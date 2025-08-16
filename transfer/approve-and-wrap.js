const { ethers } = require('ethers');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const CONFIG = {
    FACTORY_ADDRESS: '0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1',
    ERC1155_CONTRACT: '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045',
    YES_TOKEN_ID: '65880048952541620153230365826580171049439578129923156747663728476967119230732',
    TOKEN_NAME: 'Wrapped POSI YES Google AI Sept',
    TOKEN_SYMBOL: 'wPOSI-YES',
    TOKEN_DECIMALS: 18
};

function encodeMetadata(name, symbol, decimals) {
    const nameHex = ethers.utils.formatBytes32String(name);
    const symbolHex = ethers.utils.formatBytes32String(symbol);
    const decimalsHex = ethers.utils.hexlify(decimals).slice(2).padStart(2, '0');
    return nameHex + symbolHex.slice(2) + decimalsHex;
}

async function main() {
    const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log('Connected wallet:', wallet.address);

    const erc1155Abi = [
        'function balanceOf(address account, uint256 id) view returns (uint256)',
        'function isApprovedForAll(address account, address operator) view returns (bool)',
        'function setApprovalForAll(address operator, bool approved)',
        'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)'
    ];

    const erc1155 = new ethers.Contract(CONFIG.ERC1155_CONTRACT, erc1155Abi, wallet);

    // Check balance
    console.log('\nChecking YES token balance...');
    const balance = await erc1155.balanceOf(wallet.address, CONFIG.YES_TOKEN_ID);
    console.log('Balance:', balance.toString(), 'units');

    if (balance.eq(0)) {
        console.log('\n❌ No YES tokens found');
        process.exit(0);
    }

    // Check approval
    console.log('\nChecking approval...');
    const isApproved = await erc1155.isApprovedForAll(wallet.address, CONFIG.FACTORY_ADDRESS);
    
    if (!isApproved) {
        console.log('Approving factory...');
        const approveTx = await erc1155.setApprovalForAll(CONFIG.FACTORY_ADDRESS, true, {
            gasLimit: 100000,
            gasPrice: ethers.utils.parseUnits('50', 'gwei')
        });
        console.log('Approval tx:', approveTx.hash);
        console.log('Waiting for confirmation...');
        await approveTx.wait();
        console.log('✅ Factory approved');
    } else {
        console.log('✅ Already approved');
    }

    // Prepare wrapping
    const metadata = encodeMetadata(CONFIG.TOKEN_NAME, CONFIG.TOKEN_SYMBOL, CONFIG.TOKEN_DECIMALS);
    const wrapperAddress = '0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1';
    
    console.log('\n=== Wrapping ===');
    console.log('Amount:', balance.toString());
    console.log('Wrapper:', wrapperAddress);

    // Execute wrapping
    console.log('\nWrapping tokens...');
    const wrapTx = await erc1155.safeTransferFrom(
        wallet.address,
        CONFIG.FACTORY_ADDRESS,
        CONFIG.YES_TOKEN_ID,
        balance,
        metadata,
        {
            gasLimit: 600000,
            gasPrice: ethers.utils.parseUnits('50', 'gwei')
        }
    );
    
    console.log('Transaction:', wrapTx.hash);
    console.log('Waiting...');
    
    const receipt = await wrapTx.wait();
    console.log('✅ Wrapped!');
    console.log('Gas used:', receipt.gasUsed.toString());
    console.log('View on Polygonscan:', `https://polygonscan.com/tx/${receipt.transactionHash}`);
    
    console.log('\n✅ SUCCESS! YES tokens wrapped to:', wrapperAddress);
}

main().catch(console.error);