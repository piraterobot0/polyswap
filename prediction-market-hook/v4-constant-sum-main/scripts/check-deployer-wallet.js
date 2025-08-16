// Check deployer wallet balance and address
import { ethers } from 'ethers';

const PRIVATE_KEY = process.env.PRIVATE_KEY || '0x' + 'x'.repeat(64); // Use env variable
const RPC_URL = 'https://polygon-rpc.com';

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('🔍 Checking Deployer Wallet\n');
  console.log('Address:', wallet.address);
  console.log('Expected:', '0x884F5C47fA1eCaF0C8957611f648Fb320551ab51');
  console.log('Match:', wallet.address.toLowerCase() === '0x884F5C47fA1eCaF0C8957611f648Fb320551ab51'.toLowerCase());
  
  // Check balances
  const [maticBalance, yesBalance, noBalance] = await Promise.all([
    provider.getBalance(wallet.address),
    provider.call({
      to: '0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1', // YES token
      data: '0x70a08231' + wallet.address.slice(2).padStart(64, '0') // balanceOf(address)
    }),
    provider.call({
      to: '0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5', // NO token
      data: '0x70a08231' + wallet.address.slice(2).padStart(64, '0') // balanceOf(address)
    })
  ]);
  
  console.log('\n💰 Balances:');
  console.log('MATIC:', ethers.utils.formatEther(maticBalance));
  console.log('YES:', ethers.utils.formatEther(yesBalance));
  console.log('NO:', ethers.utils.formatEther(noBalance));
  
  if (maticBalance.gt(0)) {
    console.log('\n✅ Has MATIC for gas!');
  } else {
    console.log('\n❌ No MATIC for gas');
  }
  
  const totalTokens = ethers.BigNumber.from(yesBalance).add(ethers.BigNumber.from(noBalance));
  if (totalTokens.gt(0)) {
    console.log('✅ Has tokens for liquidity!');
  } else {
    console.log('❌ No tokens available');
  }
}

main().catch(console.error);