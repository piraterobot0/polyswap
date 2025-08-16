# PolySwap Project TODO List

## 🔴 High Priority - Immediate Tasks

### 1. Transfer ERC-1155 Tokens from Proxy Wallet
- [ ] **Identify proxy wallet details**
  - Document proxy wallet address
  - Identify proxy wallet type (Gnosis Safe, custom proxy, etc.)
  - List all ERC-1155 positions held
  - Document token IDs and amounts

- [ ] **Create transfer script** (`scripts/transfer-from-proxy.js`)
  - Connect to proxy wallet
  - Handle proxy-specific transfer method
  - Batch transfer support for multiple tokens
  - Gas estimation and optimization
  - Safety checks and confirmation prompts

- [ ] **Test transfer process**
  - Test on Polygon testnet first (Amoy)
  - Verify token balances pre/post transfer
  - Document gas costs

### 2. Create Wrapping Interface Scripts
- [ ] **Wrap script** (`scripts/wrap-tokens.js`)
  - Prepare token metadata (name, symbol, decimals)
  - Calculate deterministic wrapper addresses
  - Execute wrapping transaction
  - Verify ERC-20 minting

- [ ] **Unwrap script** (`scripts/unwrap-tokens.js`)
  - Check ERC-20 balances
  - Execute unwrapping
  - Verify ERC-1155 return

- [ ] **Balance checker** (`scripts/check-balances.js`)
  - Check ERC-1155 balances in proxy
  - Check wrapped ERC-20 balances
  - Display total portfolio value

## 🟡 Medium Priority - Core Features

### 3. Frontend Development with Display Scaling
- [ ] **GUI with Proper Decimal Handling**
  - **CRITICAL**: Abstract away the decimal precision issue
  - Display ERC-1155 amounts as human-readable numbers
  - For 18-decimal ERC-20s, multiply display by 10^12 or 10^18
  - Show "2.000001" instead of "0.000000000002000001"
  - Options for display:
    - Raw units (2,000,001)
    - Scaled units (2.000001 M-tokens)
    - Custom scaling based on market

- [ ] **Basic UI for wrapping/unwrapping**
  - Connect wallet (MetaMask, WalletConnect)
  - Display user's ERC-1155 positions with readable numbers
  - One-click wrap/unwrap interface
  - Clear display of conversion rates
  - Transaction history

- [ ] **Wrapper token registry**
  - Track all created wrapper tokens
  - Display token metadata
  - Show both raw and scaled balances
  - Add to MetaMask functionality
  - Custom display settings per token

### 4. Integration Scripts
- [ ] **DEX integration**
  - Script to add liquidity on QuickSwap/SushiSwap
  - Price oracle integration
  - Arbitrage opportunity scanner

- [ ] **Position management**
  - Portfolio tracking dashboard
  - P&L calculations
  - Export to CSV/JSON

### 5. Smart Contract Enhancements
- [ ] **Deploy wrapper factory on other chains**
  - Ethereum mainnet
  - Arbitrum
  - Optimism
  - Base

- [ ] **Optional: Custom wrapper features**
  - Pausable transfers
  - Fee mechanism
  - Governance integration

## 🟢 Low Priority - Nice to Have

### 6. Documentation & Testing
- [ ] **Comprehensive documentation**
  - API documentation
  - Integration guide for developers
  - Video tutorials

- [ ] **Extended test suite**
  - Mainnet fork testing
  - Load testing
  - Security audit preparation

### 7. Automation & Monitoring
- [ ] **Monitoring system**
  - Track wrapping/unwrapping events
  - Alert on large transactions
  - Gas price monitoring

- [ ] **Auto-wrapper bot**
  - Monitor specific ERC-1155 contracts
  - Auto-wrap on receipt
  - Configurable rules engine

## 📝 Next Immediate Steps

1. **Document your proxy wallet setup**
   ```markdown
   Proxy Wallet Address: 0x...
   Proxy Type: [Gnosis Safe / Custom / Other]
   Owner/Signer Addresses: [...]
   ```

2. **List your ERC-1155 positions**
   ```markdown
   Token Contract: 0x...
   Token IDs: [...]
   Amounts: [...]
   ```

3. **Start with the transfer script**
   - This is the critical blocker for using the wrapper
   - Focus on safety and proper testing

## 🚀 Quick Start Commands

```bash
# Install dependencies
cd 1155_converter/1155-to-20-master
npm install

# Create scripts directory
mkdir -p scripts

# Start with transfer script
touch scripts/transfer-from-proxy.js
touch scripts/wrap-tokens.js
touch scripts/check-balances.js
```

## 📊 Success Metrics

- [ ] Successfully transfer all ERC-1155s from proxy wallet
- [ ] Wrap at least one ERC-1155 position to ERC-20
- [ ] Verify wrapped tokens appear in wallet
- [ ] Complete one unwrap transaction successfully
- [ ] Document entire process for future reference

## 🔒 Security Checklist

- [ ] Never commit private keys or sensitive data
- [ ] Test all scripts on testnet first
- [ ] Use hardware wallet for mainnet operations
- [ ] Implement transaction simulation before execution
- [ ] Add confirmation prompts for irreversible actions
- [ ] Keep audit trail of all operations

## 💡 Notes

- The factory contract is already deployed and verified on Polygon
- Focus on the proxy wallet transfer first - it's the main blocker
- Consider using Tenderly for transaction simulation
- Join Polygon Discord for technical support if needed

---

*Last Updated: 2025-08-16*
*Contract Deployed: ✅*
*Contract Verified: ✅*
*Next Task: Transfer from proxy wallet*