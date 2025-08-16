import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon, mainnet, arbitrum, optimism, base } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'PolySwap Markets',
  projectId: process.env.VITE_WALLETCONNECT_PROJECT_ID || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', // Default fallback ID
  chains: [polygon, mainnet, arbitrum, optimism, base],
  ssr: false,
});