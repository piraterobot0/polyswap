const { ethers } = require('ethers');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Configuration
const CONFIG = {
    FACTORY_ADDRESS: '0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1',
    ERC1155_CONTRACT: '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045',
    YES_TOKEN_ID: '65880048952541620153230365826580171049439578129923156747663728476967119230732',
    NO_TOKEN_ID: '106277356443369138797049499065953438334187241175412976556484145976288075138631',
    YES_METADATA: {
        name: 'Wrapped POSI YES Google AI Sept',
        symbol: 'wPOSI-YES',
        decimals: 18
    },
    NO_METADATA: {
        name: 'Wrapped POSI NO Google AI Sept',
        symbol: 'wPOSI-NO',
        decimals: 18
    }
};

function encodeMetadata(name, symbol, decimals) {
    const nameHex = ethers.utils.formatBytes32String(name);
    const symbolHex = ethers.utils.formatBytes32String(symbol);
    const decimalsHex = ethers.utils.hexlify(decimals).slice(2).padStart(2, '0');
    return nameHex + symbolHex.slice(2) + decimalsHex;
}

async function wrapTokens(provider, wallet, tokenId, metadata, tokenName) {
    const erc1155Abi = [
        'function balanceOf(address account, uint256 id) view returns (uint256)',
        'function isApprovedForAll(address account, address operator) view returns (bool)',
        'function setApprovalForAll(address operator, bool approved)',
        'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)'
    ];

    const erc1155 = new ethers.Contract(CONFIG.ERC1155_CONTRACT, erc1155Abi, wallet);

    // Check balance
    console.log(`\n=== ${tokenName} Tokens ===`);
    const balance = await erc1155.balanceOf(wallet.address, tokenId);
    console.log('Balance to wrap:', balance.toString());

    if (balance.eq(0)) {
        console.log(`No ${tokenName} tokens to wrap`);
        return;
    }

    // Check approval
    const isApproved = await erc1155.isApprovedForAll(wallet.address, CONFIG.FACTORY_ADDRESS);
    
    if (!isApproved) {
        console.log('Approving factory...');
        const approveTx = await erc1155.setApprovalForAll(CONFIG.FACTORY_ADDRESS, true, {
            gasLimit: 100000,
            gasPrice: ethers.utils.parseUnits('50', 'gwei')
        });
        console.log('Approval tx:', approveTx.hash);
        await approveTx.wait();
        console.log('✅ Approved');
    }

    // Prepare metadata
    const encodedMetadata = encodeMetadata(metadata.name, metadata.symbol, metadata.decimals);

    // Execute wrapping
    console.log('Wrapping tokens...');
    const wrapTx = await erc1155.safeTransferFrom(
        wallet.address,
        CONFIG.FACTORY_ADDRESS,
        tokenId,
        balance,
        encodedMetadata,
        {
            gasLimit: 600000,
            gasPrice: ethers.utils.parseUnits('50', 'gwei')
        }
    );
    
    console.log('Transaction:', wrapTx.hash);
    console.log('Waiting for confirmation...');
    
    const receipt = await wrapTx.wait();
    console.log(`✅ ${tokenName} tokens wrapped!`);
    console.log('Gas used:', receipt.gasUsed.toString());
    
    return receipt;
}

async function main() {
    if (!process.env.PRIVATE_KEY) {
        console.error('❌ Please set PRIVATE_KEY in your .env file');
        process.exit(1);
    }

    const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log('Connected wallet:', wallet.address);
    console.log('\n🔄 Starting token wrapping process...');

    try {
        // Wrap YES tokens
        await wrapTokens(provider, wallet, CONFIG.YES_TOKEN_ID, CONFIG.YES_METADATA, 'YES');
        
        // Wrap NO tokens
        await wrapTokens(provider, wallet, CONFIG.NO_TOKEN_ID, CONFIG.NO_METADATA, 'NO');
        
        console.log('\n=== Summary ===');
        console.log('✅ All tokens have been wrapped successfully!');
        console.log('\nWrapped token addresses:');
        console.log('- YES (wPOSI-YES):', '0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1');
        console.log('- NO (wPOSI-NO):', '0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5');
        console.log('\nView your positions in the GUI by running:');
        console.log('  cd ../gui && npm run dev');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main().catch(console.error);