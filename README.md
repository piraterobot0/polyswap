# PolySwap - ERC-1155 to ERC-20 Converter

A smart contract system for wrapping ERC-1155 tokens into ERC-20 tokens on Polygon, enabling better liquidity and compatibility with DeFi protocols.

## 🚀 Deployed Contracts

### Polygon Mainnet
- **Wrapped1155Factory**: [`0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1`](https://polygonscan.com/address/0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1#code) ✅ Verified
- **ERC20 Implementation**: [`0xf67438Cb870c911319cd4da95d064A6B4772081C`](https://polygonscan.com/address/0xf67438Cb870c911319cd4da95d064A6B4772081C)
- **Deployment TX**: [`0xd4d7688...`](https://polygonscan.com/tx/0xd4d7688960b047fa215414412f50eddff708ca3a55071ffb958c1d6ef93c8123)

### Wrapped Prediction Market Tokens
**"Will Google have the best AI model by September 2025?"**
- **YES Token (wPOSI-YES)**: [`0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1`](https://polygonscan.com/address/0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1)
  - Symbol: wPOSI-YES
  - Decimals: 18
  - Original ERC-1155 ID: 65880048952541620153230365826580171049439578129923156747663728476967119230732
- **NO Token (wPOSI-NO)**: [`0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5`](https://polygonscan.com/address/0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5)
  - Symbol: wPOSI-NO
  - Decimals: 18
  - Original ERC-1155 ID: 106277356443369138797049499065953438334187241175412976556484145976288075138631

## 📋 Overview

This project provides a factory contract that:
1. Accepts ERC-1155 tokens and wraps them into ERC-20 tokens
2. Creates deterministic ERC-20 wrapper addresses using CREATE2
3. Allows unwrapping back to original ERC-1155 tokens
4. Supports batch operations for efficiency

## 🔧 How It Works

### Wrapping Process
1. ERC-1155 tokens are sent to the factory contract
2. Factory creates/uses a deterministic ERC-20 wrapper contract
3. ERC-20 tokens are minted to the sender
4. Original ERC-1155s are held by the factory

### Unwrapping Process
1. User calls `unwrap()` with their ERC-20 tokens
2. ERC-20 tokens are burned
3. Original ERC-1155 tokens are returned to the user

## 🛠 Technical Details

- **Solidity Version**: 0.6.12
- **License**: LGPL-3.0-or-later
- **Deployment Method**: CREATE2 via SingletonFactory
- **Gas Optimization**: Minimal proxy pattern (44 bytes runtime)
- **OpenZeppelin**: v3.4.0

## 📁 Project Structure

```
polyswap/
├── 1155_converter/
│   └── 1155-to-20-master/
│       ├── contracts/           # Smart contracts
│       ├── build/              # Compiled contracts
│       ├── test/               # Test suite
│       ├── migrations/         # Deployment scripts
│       └── scripts/            # Utility scripts
└── README.md
```

## 🔑 Environment Setup

Create a `.env` file with:
```bash
PRIVATE_KEY="your_private_key"
METAMASK_API_KEY="your_metamask_developer_api_key"
POLYGONSCAN_API_KEY="your_polygonscan_api_key"
GAS_PRICE="30"  # in gwei for Polygon
```

## 📚 Usage Examples

### For Smart Contract Integration
```solidity
// Send ERC-1155 to factory to wrap
IERC1155(token).safeTransferFrom(
    msg.sender,
    FACTORY_ADDRESS,
    tokenId,
    amount,
    tokenMetadata  // 65 bytes: name(32) + symbol(32) + decimals(1)
);

// Unwrap back to ERC-1155
factory.unwrap(
    multiToken,
    tokenId,
    amount,
    recipient,
    tokenMetadata
);
```

### Token Metadata Format
- Bytes 0-31: Token name (32 bytes)
- Bytes 32-63: Token symbol (32 bytes)  
- Byte 64: Decimals (1 byte)

## ⚠️ Important: Decimal Precision

### The 1:1 Mapping
The factory performs a **direct 1:1 mapping** between ERC-1155 and ERC-20 tokens:
- 1 ERC-1155 unit = 1 smallest unit (wei) of ERC-20
- With 18 decimals: 1 ERC-1155 = 0.000000000000000001 ERC-20

### Example with Real Numbers
- **ERC-1155 Balance**: 2,000,001 units (no decimals)
- **ERC-20 with 18 decimals**: 0.000000000002000001 tokens
- **ERC-20 with 6 decimals**: 0.002000001 tokens  
- **ERC-20 with 0 decimals**: 2,000,001 tokens

### GUI Display Recommendation
For user interfaces, we recommend:
1. **Keep 18 decimals** for maximum compatibility with DeFi
2. **Scale display** by multiplying by 10^12 for readability
3. **Show as**: "2.000001 M-wPOSI" (millions of base units)
4. Or use custom display logic based on your use case

### Quick Token Reference
Add these tokens to MetaMask on Polygon Network:
```
YES Token: 0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1
NO Token:  0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5
```

## 🧪 Testing

```bash
cd 1155_converter/1155-to-20-master
npm install
npm test
```

## 📄 License

LGPL-3.0-or-later

## 🔗 Resources

- [Original Gnosis Implementation](https://github.com/gnosis/1155-to-20)
- [EIP-1155 Standard](https://eips.ethereum.org/EIPS/eip-1155)
- [EIP-2470 SingletonFactory](https://eips.ethereum.org/EIPS/eip-2470)
