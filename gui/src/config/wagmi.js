import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon, mainnet, arbitrum, optimism, base } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'PolySwap Markets',
  projectId: 'YOUR_PROJECT_ID', // You can get one from https://cloud.walletconnect.com
  chains: [polygon, mainnet, arbitrum, optimism, base],
  ssr: false,
});