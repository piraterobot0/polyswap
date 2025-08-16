const { ethers } = require('ethers');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function main() {
    const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log('Wallet:', wallet.address);
    
    const erc1155Abi = [
        'function balanceOf(address account, uint256 id) view returns (uint256)',
        'function isApprovedForAll(address account, address operator) view returns (bool)'
    ];
    
    const erc1155 = new ethers.Contract(
        '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045',
        erc1155Abi,
        provider
    );
    
    // Check YES token balance
    const yesBalance = await erc1155.balanceOf(
        wallet.address,
        '65880048952541620153230365826580171049439578129923156747663728476967119230732'
    );
    console.log('YES tokens (unwrapped):', yesBalance.toString());
    
    // Check approval
    const isApproved = await erc1155.isApprovedForAll(
        wallet.address,
        '0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1'
    );
    console.log('Factory approved:', isApproved);
    
    // Check wrapped token (if exists)
    const wrapperAddress = '0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1';
    const code = await provider.getCode(wrapperAddress);
    
    if (code !== '0x') {
        console.log('\nWrapper contract deployed: YES');
        
        const erc20Abi = ['function balanceOf(address) view returns (uint256)'];
        const wrapped = new ethers.Contract(wrapperAddress, erc20Abi, provider);
        const wrappedBalance = await wrapped.balanceOf(wallet.address);
        console.log('YES tokens (wrapped):', wrappedBalance.toString());
    } else {
        console.log('\nWrapper contract deployed: NO (will be created on first wrap)');
    }
}

main().catch(console.error);