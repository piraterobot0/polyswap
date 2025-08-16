# 📋 Testing MATIC Transfer Between Accounts

## Prerequisites

### 1. ✅ Private Keys Set
You've already added `PRIVATE_KEY1` and `PRIVATE_KEY2` to your `.env` file.

### 2. ✅ Polygon RPC Already Configured!
The system now automatically uses public RPCs from `config/public_rpcs.json`. 
No need to add anything to `.env` unless you want to use a private RPC.

**Optional:** For better performance, add a private RPC to `.env`:
- **Alchemy**: https://www.alchemy.com (sign up free, create Polygon app)
  - Example: `POLYGON_RPC=https://polygon-mainnet.g.alchemy.com/v2/YOUR-API-KEY`

The system will:
1. Try private RPC from `.env` first (if exists)
2. Fall back to public RPCs automatically if needed

### 3. ❌ Get MATIC in Account 1
You need at least 0.011 MATIC in Account 1:
- 0.01 MATIC to send
- ~0.001 MATIC for gas fees

To check your addresses and balances:
```bash
python test_accounts.py
```

This will show you both account addresses. You'll need to send some MATIC to Account #1's address.

## Testing Options

### Option 1: Test on Polygon Mumbai (Testnet) - RECOMMENDED
Safer for testing, uses free test MATIC:

1. Change network in `.env`:
   ```
   DEFAULT_NETWORK=mumbai
   ```

2. Add Mumbai RPC:
   ```
   MUMBAI_RPC=https://rpc-mumbai.maticvigil.com
   ```

3. Get free test MATIC:
   - Go to: https://faucet.polygon.technology
   - Enter your Account #1 address
   - Request test MATIC

4. Run test:
   ```bash
   python test_transfer.py
   ```

### Option 2: Test on Polygon Mainnet
Uses real MATIC (costs ~$0.01):

1. Make sure you have MATIC in Account #1
2. Run the test:
   ```bash
   python test_transfer.py
   ```

### Option 3: Manual Transfer Commands

#### Simple transfer between your accounts:
```bash
# Send from Account 1 to Account 2
python scripts/interact/send_native.py --from-account 1 --amount 0.01

# Send from Account 2 to Account 1
python scripts/interact/send_native.py --from-account 2 --amount 0.01
```

#### Specify custom recipient:
```bash
python scripts/interact/send_native.py \
  --from-account 1 \
  --to 0xRECIPIENT_ADDRESS \
  --amount 0.01 \
  --network polygon
```

## Quick Test Checklist

- [ ] Add POLYGON_RPC to `.env`
- [ ] Get 0.011+ MATIC in Account #1
- [ ] Run: `python test_transfer.py`
- [ ] Confirm the transaction when prompted
- [ ] Wait for confirmation (~30 seconds)

## Troubleshooting

### "Missing POLYGON_RPC"
Add the RPC endpoint to your `.env` file (see step 2 above)

### "Insufficient balance"
Account #1 needs at least 0.011 MATIC. Check balance:
```bash
python scripts/tokens/balance.py --network polygon --account 1
```

### "Connection failed"
Try a different RPC endpoint, some public ones may be unreliable.

## Safety Notes

⚠️ **Remember:**
- This is a HOT WALLET - keep values under $30
- Test on Mumbai testnet first if unsure
- Each transfer costs gas fees (~$0.001 on Polygon)
- Always verify addresses before sending

---

Ready? Run: `python test_transfer.py`