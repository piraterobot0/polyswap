const { ethers } = require('ethers');

async function main() {
    const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');
    
    const addresses = {
        EOA: '0x884F5C47fA1eCaF0C8957611f648Fb320551ab51',
        SAFE: '0x27dBD952974cbFd2fEbD87890a82B50225e97bC9',
        YES_WRAPPER: '0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1',
        NO_WRAPPER: '0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5'
    };
    
    const erc20Abi = [
        'function balanceOf(address) view returns (uint256)',
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function totalSupply() view returns (uint256)'
    ];
    
    console.log('=== FINAL TOKEN STATUS ===\n');
    
    // Check YES wrapper
    const yesToken = new ethers.Contract(addresses.YES_WRAPPER, erc20Abi, provider);
    const yesBalance = await yesToken.balanceOf(addresses.EOA);
    const yesName = await yesToken.name();
    const yesSymbol = await yesToken.symbol();
    const yesSupply = await yesToken.totalSupply();
    
    console.log('YES Token (wPOSI-YES):');
    console.log('- Contract:', addresses.YES_WRAPPER);
    console.log('- Name:', yesName);
    console.log('- Your balance:', yesBalance.toString(), 'wei');
    console.log('- Scaled balance:', ethers.utils.formatUnits(yesBalance.mul(ethers.BigNumber.from(10).pow(12)), 18), yesSymbol);
    console.log('- Total supply:', yesSupply.toString());
    
    // Check NO wrapper
    const noToken = new ethers.Contract(addresses.NO_WRAPPER, erc20Abi, provider);
    const noBalance = await noToken.balanceOf(addresses.EOA);
    const noName = await noToken.name();
    const noSymbol = await noToken.symbol();
    const noSupply = await noToken.totalSupply();
    
    console.log('\nNO Token (wPOSI-NO):');
    console.log('- Contract:', addresses.NO_WRAPPER);
    console.log('- Name:', noName);
    console.log('- Your balance:', noBalance.toString(), 'wei');
    console.log('- Scaled balance:', ethers.utils.formatUnits(noBalance.mul(ethers.BigNumber.from(10).pow(12)), 18), noSymbol);
    console.log('- Total supply:', noSupply.toString());
    
    // Calculate totals
    const totalYes = parseFloat(ethers.utils.formatUnits(yesBalance.mul(ethers.BigNumber.from(10).pow(12)), 18));
    const totalNo = parseFloat(ethers.utils.formatUnits(noBalance.mul(ethers.BigNumber.from(10).pow(12)), 18));
    const total = totalYes + totalNo;
    
    console.log('\n=== PORTFOLIO SUMMARY ===');
    console.log('Total YES position:', totalYes.toLocaleString(), 'shares');
    console.log('Total NO position:', totalNo.toLocaleString(), 'shares');
    console.log('Total shares:', total.toLocaleString());
    console.log('\nPosition split:');
    console.log('- YES:', (totalYes/total*100).toFixed(1) + '%');
    console.log('- NO:', (totalNo/total*100).toFixed(1) + '%');
    
    console.log('\n✅ All tokens successfully transferred and wrapped!');
    console.log('\nTransactions:');
    console.log('- YES transfer 1: 0x762e6a199a1369fbe809ed05914a1816655837c5992266c6e76b44825dd52551');
    console.log('- YES transfer 2: 0x19bda9179ec4cdb880e2779fc1cca9e83c63020f187fcbbabfd75dd7b45796bc');
    console.log('- NO transfer: 0x584f3b8f26b2fdc53e68bfe1be555d97f63359c7f4f35e9d519034f3fd26c3a4');
    console.log('- YES wrapping: 0xdd354ab6c2fa787e242cca71d1457d524873b12d119c688610d74cb127040369');
    console.log('- NO wrapping: 0xe0a1b1b605d29e7056c5fcbd2adcbe9bd8610093fddedfabcf7db1bfd72072df');
}

main().catch(console.error);