# Security Policy

## ⚠️ IMPORTANT SECURITY NOTICE

This project is experimental and has NOT been audited. Use at your own risk.

## Known Security Considerations

### Smart Contract Security
- The Wrapped1155Factory contract uses CREATE2 for deterministic deployments
- Implements minimal proxy pattern (EIP-1167) for gas efficiency
- Uses OpenZeppelin v3.4.0 contracts (consider upgrading to latest)
- Solidity version 0.6.12 (consider upgrading to 0.8.x)

### Recommended Security Improvements
1. **Reentrancy Protection**: Add explicit reentrancy guards to unwrap functions
2. **Data Validation**: Implement comprehensive input validation
3. **Emergency Pause**: Add pausable functionality for emergency situations
4. **Access Controls**: Consider adding admin controls for emergency scenarios

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please:
1. **DO NOT** create a public issue
2. Email the details to [security contact email]
3. Allow time for the issue to be addressed before public disclosure

## Security Best Practices for Users

1. **Never share private keys or seed phrases**
2. **Verify contract addresses** before interacting
3. **Start with small amounts** when testing
4. **Check transaction details** before signing
5. **Use hardware wallets** for significant amounts

## Configuration Security

- Never commit `.env` files with real values
- Use environment variables for sensitive data
- Rotate API keys regularly
- Use secure key management services in production

## Audit Status

🔴 **NOT AUDITED** - This code has not undergone formal security audit. Use in production at your own risk.