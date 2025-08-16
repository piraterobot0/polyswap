# ERC-1155 to ERC-20 Wrapper GUI

A modern web interface for wrapping ERC-1155 tokens into fungible ERC-20 tokens.

## Features

- Connect wallet using RainbowKit
- Wrap ERC-1155 tokens into ERC-20 tokens
- Unwrap ERC-20 tokens back to ERC-1155
- Check balances for both token types
- Custom token metadata (name, symbol, decimals)
- Multi-chain support (Polygon, Ethereum, Arbitrum, Optimism, Base)

## Setup

1. Install dependencies:
```bash
cd gui
npm install
```

2. Configure the factory contract:
   - Deploy the `Wrapped1155Factory` contract from `1155_converter/1155-to-20-master/contracts/`
   - Update `FACTORY_ADDRESS` in `src/config/contracts.js`

3. Get a WalletConnect Project ID:
   - Go to https://cloud.walletconnect.com
   - Create a project and copy the Project ID
   - Update `projectId` in `src/config/wagmi.js`

4. Run the development server:
```bash
npm run dev
```

5. Open http://localhost:3000

## How Token Wrapping Works

When users wrap their ERC-1155 tokens:
1. The factory creates a deterministic ERC-20 wrapper contract
2. The wrapper address is determined by: ERC-1155 contract + token ID + metadata
3. **Important**: All users wrapping the same ERC-1155 token ID get the SAME ERC-20 token
4. This makes wrapped tokens fungible between different users!

## Usage

1. Connect your wallet
2. Enter the ERC-1155 contract address
3. Enter the token ID you want to wrap
4. Approve the factory contract
5. Wrap your tokens to receive ERC-20 tokens
6. Use the Unwrap tab to convert back to ERC-1155

## Build for Production

```bash
npm run build
npm run preview
```