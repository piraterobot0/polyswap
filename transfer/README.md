# ERC-1155 Transfer Tools for Gnosis Safe

This directory contains scripts for transferring ERC-1155 tokens from Gnosis Safe wallets on Polygon.

## Overview

The main script `simple-safe-transfer.js` enables direct transfers of ERC-1155 tokens from a Gnosis Safe where you are the sole owner with a threshold of 1.

## Prerequisites

- Node.js v14 or higher
- npm or yarn
- Private key of the Gnosis Safe owner
- Polygon RPC endpoint (Infura, Alchemy, or public RPC)

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your private key to `.env`:
```
PRIVATE_KEY=your_private_key_here_without_0x
```

Note: The RPC URL can be configured in `.env` or it will use the one from the parent 1155_converter directory.

## Usage

### Simple Safe Transfer (Sole Owner)

For Gnosis Safes with a single owner and threshold of 1:

```bash
node simple-safe-transfer.js
```

This script will:
1. Verify you are the owner of the Safe
2. Check the token balance
3. Execute the transfer using the approved hash signature method
4. Display the transaction hash upon success

### Configuration

Edit the configuration variables in `simple-safe-transfer.js`:

```javascript
const SAFE_ADDRESS = 'your_safe_address';
const TOKEN_CONTRACT = 'erc1155_token_contract';
const TO_ADDRESS = 'destination_address';
const TOKEN_ID = 'token_id_to_transfer';
const AMOUNT = 'amount_to_transfer';
```

## Alternative Scripts

- `transfer-1155.js` - Direct ERC-1155 transfers (requires direct wallet ownership)
- `gnosis-safe-transfer.js` - Standard Gnosis Safe transfer attempts
- `safe-sdk-transfer.js` - Uses Gnosis Safe SDK (for more complex scenarios)

## Security Notes

- **NEVER** commit your `.env` file with private keys
- Always verify transaction details before signing
- Test with small amounts first
- Ensure you have sufficient MATIC for gas fees

## Troubleshooting

### Common Errors

- **GS026**: Invalid signature - Ensure you're using the correct private key for a Safe owner
- **GS025**: Hash not approved - The transaction needs proper approval
- **GS013**: Transaction failed - Check token balance and parameters
- **Insufficient balance**: Verify the Safe has enough tokens

### Network Configuration

Default RPC: `https://polygon-rpc.com/`

For better reliability, use a dedicated RPC provider:
- Infura: `https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID`
- Alchemy: `https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY`

## License

MIT