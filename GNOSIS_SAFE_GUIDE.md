# Gnosis Safe ERC-1155 Transfer Guide

## Overview
Your ERC-1155 tokens are in a Gnosis Safe. You have two paths:
1. **Transfer to EOA first** (simpler, 2 transactions)
2. **Wrap directly from Safe** (advanced, 1 transaction)

---

## Option 1: Transfer to Your Wallet First (Recommended)

### Step 1: Access Your Safe
1. Go to https://app.safe.global/
2. Connect your wallet
3. Select Polygon network
4. Enter your Safe address or select from your list

### Step 2: Create New Transaction
1. Click **"New transaction"**
2. Select **"Contract interaction"**

### Step 3: Set Up the Transfer
1. **Contract address**: Enter your ERC-1155 contract address
2. **ABI**: The interface will auto-load, or paste this minimal ABI:
```json
[{
  "inputs": [
    {"name": "from", "type": "address"},
    {"name": "to", "type": "address"},
    {"name": "id", "type": "uint256"},
    {"name": "amount", "type": "uint256"},
    {"name": "data", "type": "bytes"}
  ],
  "name": "safeTransferFrom",
  "outputs": [],
  "type": "function"
}]
```

### Step 4: Fill Transfer Parameters
- **Method**: Select `safeTransferFrom`
- **from**: Your Safe address (auto-filled)
- **to**: Your personal wallet: `0x884F5C47fA1eCaF0C8957611f648Fb320551ab51`
- **id**: Your token ID (e.g., `1`)
- **amount**: Amount to transfer (e.g., `100`)
- **data**: Enter `0x` (empty bytes)

### Step 5: Execute
1. Click **"Create transaction"**
2. Review details
3. Click **"Submit"**
4. Sign with required signers
5. Execute when threshold reached

### Step 6: Wrap Your Tokens
Once in your wallet, use the wrap script:
```bash
cd 1155_converter/1155-to-20-master
node scripts/wrap-tokens.js
```

---

## Option 2: Direct Wrapping from Safe (Advanced)

This sends ERC-1155s directly from Safe to the Factory, creating wrapped tokens in one transaction.

### Transaction Details
- **To (Contract)**: Your ERC-1155 contract
- **Method**: `safeTransferFrom`
- **Parameters**:
  - **from**: Your Safe address
  - **to**: `0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1` (Factory)
  - **id**: Token ID
  - **amount**: Amount to wrap
  - **data**: 65 bytes of metadata (see below)

### Metadata Encoding (Critical!)
The `data` field must be exactly 65 bytes:
- Bytes 0-31: Token name (padded to 32 bytes)
- Bytes 32-63: Token symbol (padded to 32 bytes)
- Byte 64: Decimals (typically `0x12` for 18)

Example for "Wrapped Token" with symbol "WRAP" and 18 decimals:
```
0x577261707065642050726f6a65637420546f6b656e0000000000000000000000575241500000000000000000000000000000000000000000000000000000000012
```

---

## Option 3: Batch Transfer Multiple Tokens

If you have multiple token IDs to transfer:

### Use safeBatchTransferFrom
```json
[{
  "inputs": [
    {"name": "from", "type": "address"},
    {"name": "to", "type": "address"},
    {"name": "ids", "type": "uint256[]"},
    {"name": "amounts", "type": "uint256[]"},
    {"name": "data", "type": "bytes"}
  ],
  "name": "safeBatchTransferFrom",
  "outputs": [],
  "type": "function"
}]
```

**Parameters**:
- **ids**: `[1, 2, 3]` (array of token IDs)
- **amounts**: `[100, 200, 300]` (amounts for each)
- **data**: `0x` for transfer, or encoded metadata for wrapping

---

## Important Addresses

| Contract | Address | Purpose |
|----------|---------|---------|
| Factory | `0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1` | Wraps ERC-1155 to ERC-20 |
| Your EOA | `0x884F5C47fA1eCaF0C8957611f648Fb320551ab51` | Your wallet address |
| Safe | `[Your Safe Address]` | Current token holder |
| ERC-1155 | `[Token Contract]` | The token to transfer |

---

## Transaction Builder JSON

You can also use Safe's Transaction Builder app:

1. Go to **Apps** → **Transaction Builder**
2. Create a batch with this JSON:

```json
{
  "version": "1.0",
  "chainId": "137",
  "createdAt": 1234567890,
  "meta": {
    "name": "Transfer ERC-1155 to EOA"
  },
  "transactions": [
    {
      "to": "[ERC-1155_CONTRACT_ADDRESS]",
      "value": "0",
      "data": "[ENCODED_FUNCTION_CALL]"
    }
  ]
}
```

---

## Troubleshooting

### "Insufficient privileges"
- Ensure you're a Safe owner/signer
- Check if Safe has enough signatures

### "Transfer failed"
- Verify Safe owns the tokens
- Check token ID and amounts
- Ensure correct contract address

### "Cannot estimate gas"
- Token might not exist
- Amounts might exceed balance
- Contract might be paused

---

## Security Notes

⚠️ **Always verify**:
- Contract addresses (no typos!)
- Token IDs and amounts
- Recipient address
- Transaction simulation results

✅ **Best Practices**:
- Test with small amounts first
- Use Safe's simulation feature
- Double-check all addresses
- Keep transaction records