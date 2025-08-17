# Project Cleanup Plan - Migrate to Uniswap V3

## Current Structure Analysis

### To Keep (Uniswap V3 Focus):
- `/gui/` - Frontend application
  - `/gui/src/components/UniswapSwap.jsx` - V3 swap interface
  - `/gui/src/hooks/useUniswapV3.js` - V3 hooks
  - `/gui/src/config/uniswapConfig.js` - V3 configuration
- `/1155_converter/` - Token converter (may be useful)
- Documentation files (README, STATUS, etc.)

### To Remove (Uniswap V4 Related):
- `/prediction-market-hook/` - Entire V4 hook implementation
- `/gui/src/hooks/useHookContract.js` - V4 hook contract interface
- `/gui/src/config/hookAbi.js` - V4 hook ABI
- `/mine_salt.py` - V4 address mining script
- `/hook_salt.txt` - V4 deployment salt
- `/poolvalidation.md` - V4 pool issues
- `/pool_response.md` - V4 troubleshooting

### To Update:
- `/gui/src/components/PredictionMarket.jsx` - Switch to V3 pools
- `/gui/src/config/contractAddresses.js` - Remove V4 addresses
- `/STATUS.md` - Update to reflect V3 focus
- `/README.md` - Update project description

## New Structure:
```
/polyswap/
├── gui/                    # Frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # V3 hooks only
│   │   └── config/         # V3 configuration
│   └── package.json
├── contracts/              # Smart contracts (if needed)
│   └── v3/                 # V3 related contracts
├── docs/                   # Documentation
└── README.md
```

## Benefits of V3 over V4:
1. ✅ Proven and battle-tested on Polygon
2. ✅ No initialization issues
3. ✅ Existing liquidity and infrastructure
4. ✅ Well-documented and supported
5. ✅ Can still create prediction markets using V3 pools