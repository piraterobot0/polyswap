# YES Token Transfer & Wrapping Guide

## Overview
Transfer and wrap the YES token for "Will Google have the best AI model by September 2025?"

## Token Details

| Property | Value |
|----------|-------|
| **Question** | Will Google have the best AI model by September 2025? |
| **Token Type** | YES (Google will lead) |
| **ERC-1155 Contract** | `0x4D97DCd97eC945f40cF65F87097ACe5EA0476045` |
| **Token ID** | `65880048952541620153230365826580171049439578129923156747663728476967119230732` |
| **Current Location** | Gnosis Safe: `0x27dBD952974cbFd2fEbD87890a82B50225e97bC9` |
| **Destination** | Your EOA: `0x884F5C47fA1eCaF0C8957611f648Fb320551ab51` |

## Wrapped Token Details

| Property | Value |
|----------|-------|
| **Wrapper Address** | `0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1` |
| **Symbol** | wPOSI-YES |
| **Decimals** | 18 |
| **Name** | Wrapped POSI YES Google AI Sept |

## Step 1: Transfer from Gnosis Safe to EOA

### Prerequisites
1. Create `.env` file in the `transfer/` directory:
```bash
cd transfer
echo 'PRIVATE_KEY=your_private_key_without_0x' > .env
```

2. Ensure you have MATIC for gas fees

### Execute Transfer
```bash
# From project root
./transfer-yes-tokens.sh

# Or manually:
cd transfer
node simple-safe-transfer.js
```

This will transfer 1,000,000 YES tokens from your Gnosis Safe to your EOA.

## Step 2: Wrap the Tokens

After the transfer completes, wrap the tokens to get ERC-20 tokens:

```bash
cd scripts
node execute-wrap-yes.js
```

This will:
1. Check your YES token balance
2. Approve the factory if needed
3. Send tokens to the factory with metadata
4. Create/mint wrapped ERC-20 tokens to your address

## Step 3: View in GUI

Once wrapped, your positions will appear in the GUI:

```bash
cd gui
npm install
npm run dev
```

Open http://localhost:3000 and connect your wallet to see:
- Your YES position in green
- Your NO position in red (already wrapped)
- Position ratios and portfolio summary

## Addresses Summary

| Contract | Address | Purpose |
|----------|---------|---------|
| Gnosis Safe | `0x27dBD952974cbFd2fEbD87890a82B50225e97bC9` | Current holder |
| Your EOA | `0x884F5C47fA1eCaF0C8957611f648Fb320551ab51` | Transfer destination |
| Factory | `0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1` | Wrapping factory |
| YES Wrapper | `0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1` | Wrapped YES token |
| NO Wrapper | `0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5` | Wrapped NO token |

## Comparison: YES vs NO Tokens

| Aspect | YES Token | NO Token |
|--------|-----------|----------|
| Meaning | Google will have best AI | Others will have best AI |
| Token ID | `6588004895...30732` | `1062773564...38631` |
| Wrapper | `0x91BdE8266...77B1` | `0xcDb79f7f9...3C5` |
| Symbol | wPOSI-YES | wPOSI-NO |
| Status | To be wrapped | Already wrapped |

## Troubleshooting

### Transfer Issues
- **GS026 Error**: Wrong private key - ensure you're using the Safe owner's key
- **Insufficient balance**: Check Safe has the tokens
- **Gas issues**: Ensure you have enough MATIC

### Wrapping Issues
- **No balance**: Ensure transfer completed first
- **Approval needed**: Script will handle this automatically
- **Wrong metadata**: Use the encoded data from the script

## Important Notes

⚠️ **Security**:
- Never share or commit your private key
- Verify all addresses before transactions
- Test with small amounts first

✅ **Best Practices**:
- Keep transaction hashes for records
- Add wrapped tokens to MetaMask for visibility
- Monitor gas prices on Polygon

## Quick Commands Reference

```bash
# Check config
cat transfer/config.js

# Transfer tokens
cd transfer && node simple-safe-transfer.js

# Calculate wrapper address
node scripts/wrap-yes-token.js

# Execute wrapping
node scripts/execute-wrap-yes.js

# Start GUI
cd gui && npm run dev
```

---

*Last Updated: 2025-08-16*
*Market Expires: September 30, 2025*