# Deployment Guide

## Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Edit `.env` and add your configuration:
- `PRIVATE_KEY` - Your deployment wallet private key
- `POLYGON_RPC` - RPC endpoint for Polygon mainnet
- `POLYGONSCAN_API_KEY` - API key for contract verification

## Deployment Scripts

All deployment scripts now use environment variables for configuration. Default values are provided for well-known addresses.

### Deploy Hook Without Validation (Quick Deploy)
```bash
forge script script/DeployNoValidation.s.sol --rpc-url $POLYGON_RPC --broadcast
```

### Deploy Hook With Mining (Find Valid Address)
```bash
forge script script/MineAndDeploy.s.sol --rpc-url $POLYGON_RPC --broadcast
```

### Deploy Full Hook With Liquidity
```bash
forge script script/DeployPredictionMarket.s.sol --rpc-url $POLYGON_RPC --broadcast
```

### Add Liquidity to Existing Hook
First, update `HOOK_ADDRESS` in your `.env` file, then:
```bash
forge script script/AddLiquidity_1Each.s.sol --rpc-url $POLYGON_RPC --broadcast
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PRIVATE_KEY` | Deployment wallet private key | Required |
| `POLYGON_RPC` | Polygon mainnet RPC endpoint | Required |
| `POLYGONSCAN_API_KEY` | For contract verification | Optional |
| `POOLMANAGER` | V4 PoolManager address | 0x67366782805870060151383F4BbFF9daB53e5cD6 |
| `YES_TOKEN` | YES token address | 0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1 |
| `NO_TOKEN` | NO token address | 0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5 |
| `HOOK_ADDRESS` | Deployed hook address | Required for liquidity scripts |

## Deployed Contracts

- **PredictionMarketHook**: `0x349810b251D655169fAd188CAC0F70c534130327` (No validation version)

## Security Notes

- Never commit your `.env` file to version control
- Use a separate deployment wallet with limited funds
- Verify all addresses before deploying
- Test on testnet first when possible