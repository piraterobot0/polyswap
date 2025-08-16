const { ethers } = require('ethers');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function main() {
    const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');
    
    const SAFE_ADDRESS = '0x27dBD952974cbFd2fEbD87890a82B50225e97bC9';
    const ERC1155_CONTRACT = '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045';
    const EOA_ADDRESS = '0x884F5C47fA1eCaF0C8957611f648Fb320551ab51';
    
    // Token IDs
    const YES_TOKEN_ID = '65880048952541620153230365826580171049439578129923156747663728476967119230732';
    const NO_TOKEN_ID = '106277356443369138797049499065953438334187241175412976556484145976288075138631';
    
    const erc1155Abi = [
        'function balanceOf(address account, uint256 id) view returns (uint256)'
    ];
    
    const erc1155 = new ethers.Contract(ERC1155_CONTRACT, erc1155Abi, provider);
    
    console.log('=== Checking Token Balances ===\n');
    
    // Check Safe balances
    console.log('Gnosis Safe:', SAFE_ADDRESS);
    const safeYesBalance = await erc1155.balanceOf(SAFE_ADDRESS, YES_TOKEN_ID);
    const safeNoBalance = await erc1155.balanceOf(SAFE_ADDRESS, NO_TOKEN_ID);
    console.log('- YES tokens:', safeYesBalance.toString());
    console.log('- NO tokens:', safeNoBalance.toString());
    
    // Check EOA balances
    console.log('\nEOA Wallet:', EOA_ADDRESS);
    const eoaYesBalance = await erc1155.balanceOf(EOA_ADDRESS, YES_TOKEN_ID);
    const eoaNoBalance = await erc1155.balanceOf(EOA_ADDRESS, NO_TOKEN_ID);
    console.log('- YES tokens:', eoaYesBalance.toString());
    console.log('- NO tokens:', eoaNoBalance.toString());
    
    // Summary
    console.log('\n=== Transfer Needed ===');
    if (safeYesBalance.gt(0)) {
        console.log(`- Transfer ${safeYesBalance.toString()} YES tokens from Safe to EOA`);
    }
    if (safeNoBalance.gt(0)) {
        console.log(`- Transfer ${safeNoBalance.toString()} NO tokens from Safe to EOA`);
    }
    if (safeYesBalance.eq(0) && safeNoBalance.eq(0)) {
        console.log('✅ No tokens left in Safe - all transferred!');
    }
    
    // Check wrapped tokens
    console.log('\n=== Wrapped Token Status ===');
    const yesWrapper = '0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1';
    const noWrapper = '0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5';
    
    const erc20Abi = ['function balanceOf(address) view returns (uint256)'];
    
    // Check if wrappers exist
    const yesCode = await provider.getCode(yesWrapper);
    const noCode = await provider.getCode(noWrapper);
    
    if (yesCode !== '0x') {
        const yesWrapped = new ethers.Contract(yesWrapper, erc20Abi, provider);
        const yesWrappedBalance = await yesWrapped.balanceOf(EOA_ADDRESS);
        console.log('YES wrapped tokens:', yesWrappedBalance.toString());
    } else {
        console.log('YES wrapper: Not deployed yet (will deploy on first wrap)');
    }
    
    if (noCode !== '0x') {
        const noWrapped = new ethers.Contract(noWrapper, erc20Abi, provider);
        const noWrappedBalance = await noWrapped.balanceOf(EOA_ADDRESS);
        console.log('NO wrapped tokens:', noWrappedBalance.toString());
    } else {
        console.log('NO wrapper: Not deployed yet');
    }
}

main().catch(console.error);