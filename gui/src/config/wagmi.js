import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon, mainnet, arbitrum, optimism, base } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'ERC1155 Wrapper',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains: [polygon, mainnet, arbitrum, optimism, base],
  ssr: false,
});