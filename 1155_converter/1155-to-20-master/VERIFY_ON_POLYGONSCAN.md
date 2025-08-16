# Polygonscan Verification Guide

## Contract Details
- **Contract Address:** `0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1`
- **Network:** Polygon Mainnet
- **Contract Name:** Wrapped1155Factory

## Manual Verification Steps

1. **Go to Polygonscan Verification Page**
   - Visit: https://polygonscan.com/verifyContract
   - Or go directly to: https://polygonscan.com/verifyContract?a=0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1

2. **Fill in the Verification Form**
   - **Contract Address:** `0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1`
   - **Contract Name:** `Wrapped1155Factory`
   - **Compiler:** `v0.6.12+commit.27d51765`
   - **Optimization:** `No`
   - **Enter Solidity Contract Code:** Copy entire contents of `flattened.sol`
   - **Constructor Arguments:** Leave empty (no constructor arguments)
   - **Contract Library Address:** Leave empty
   - **Misc Settings:**
     - Runs: Leave as 200 (default)
     - EVM Version: Default (istanbul)
     - License Type: `LGPL-3.0`

3. **Submit and Complete CAPTCHA**

## Alternative: Using Polygonscan API

1. **Get API Key**
   - Register at https://polygonscan.com/register
   - Go to https://polygonscan.com/myapikey
   - Create new API key

2. **Add to .env file**
   ```
   POLYGONSCAN_API_KEY="your_api_key_here"
   ```

3. **Update truffle-config.js**
   Add to api_keys section:
   ```javascript
   api_keys: {
     etherscan: etherscanApiKey,
     polygonscan: process.env.POLYGONSCAN_API_KEY
   }
   ```

4. **Run verification command**
   ```bash
   npx truffle run verify Wrapped1155Factory@0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1 --network polygon --license LGPL-3.0-or-later
   ```

## Files Available
- `flattened.sol` - Complete flattened source code for verification
- `contracts/Wrapped1155Factory.sol` - Original source file

## Deployed Addresses
- **Factory:** `0xc14f5d2b9d6945ef1ba93f8db20294b90fa5b5b1`
- **ERC20 Implementation:** `0xf67438Cb870c911319cd4da95d064A6B4772081C`

## Transaction
- **Deployment TX:** [0xd4d7688960b047fa215414412f50eddff708ca3a55071ffb958c1d6ef93c8123](https://polygonscan.com/tx/0xd4d7688960b047fa215414412f50eddff708ca3a55071ffb958c1d6ef93c8123)