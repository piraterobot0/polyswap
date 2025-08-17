import { createConfig, http } from 'wagmi';
import { polygon, mainnet, arbitrum, optimism, base } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Simple configuration with MetaMask (injected wallet) support only
export const config = createConfig({
  chains: [polygon, mainnet, arbitrum, optimism, base],
  connectors: [
    injected({
      target: 'metaMask',
      name: 'MetaMask',
    }),
  ],
  transports: {
    [polygon.id]: http('https://polygon-rpc.com'),
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
  },
});