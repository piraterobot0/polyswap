# ⛽ Gas Manager Documentation

The Gas Manager is a comprehensive utility for handling gas estimation, pricing, and transaction optimization in Web3 applications.

## Features

### 1. **Dynamic Gas Pricing**
- Supports both Legacy and EIP-1559 transactions
- Multiple priority levels: `slow`, `standard`, `fast`, `instant`
- Network-specific configurations
- Automatic fee cap enforcement

### 2. **Smart Gas Estimation**
- Automatic gas limit estimation with safety buffers
- Transaction type detection (simple transfer vs contract interaction)
- Network-specific multipliers
- Fallback to safe defaults on estimation failure

### 3. **Batch Transaction Optimization**
- Calculate optimal transaction count based on balance
- Cost breakdown per transaction
- Reserve balance protection
- Gas cost predictions

### 4. **Nonce Management**
- Sequential nonce tracking
- Automatic synchronization on errors
- Prevents nonce conflicts in batch operations

### 5. **Multi-Network Support**
- Pre-configured for Ethereum, Polygon, Arbitrum, BSC
- Network-specific gas strategies
- Customizable configurations

## Usage Examples

### Basic Usage

```python
from utils import Web3Manager

# Initialize with gas manager included
w3 = Web3Manager('polygon')

# Access gas manager
gas_mgr = w3.gas_manager

# Get current gas prices
prices = gas_mgr.get_gas_price('fast')
print(f"Fast gas: {w3.w3.from_wei(prices['maxFeePerGas'], 'gwei')} gwei")
```

### Build Optimized Transaction

```python
# Build transaction with automatic gas handling
tx = w3.gas_manager.build_transaction(
    from_address=w3.account.address,
    to_address='0x...',
    value=0.01,  # ETH/MATIC
    gas_priority='standard'  # or 'slow', 'fast', 'instant'
)

# Sign and send
signed = w3.account.sign_transaction(tx)
tx_hash = w3.w3.eth.send_raw_transaction(signed.raw)
```

### Estimate Transaction Costs

```python
# Get detailed cost breakdown
gas_limit = 21000  # or estimate
cost = w3.gas_manager.calculate_transaction_cost(gas_limit)

print(f"Gas Limit: {cost['gas_limit']:,}")
print(f"Gas Price: {cost['gas_price_gwei']:.2f} gwei")
print(f"Cost: {cost['cost_eth']:.6f} ETH (~${cost['cost_usd']:.2f})")
```

### Batch Transaction Planning

```python
# Plan multiple transactions
balance = w3.get_balance()
plan = w3.gas_manager.optimize_gas_for_batch(
    num_transactions=50,
    value_per_tx=0.01,
    balance=balance
)

print(f"Can execute: {plan['recommended_count']} transactions")
print(f"Total cost: {plan['total_cost']:.6f} ETH")
print(f"Gas budget: {plan['total_gas_cost']:.6f} ETH")
```

### Nonce Management

```python
# Get nonce manager for sequential transactions
nonce_mgr = w3.gas_manager.get_nonce_manager(w3.account.address)

# Send multiple transactions
for i in range(10):
    tx = w3.gas_manager.build_transaction(
        from_address=w3.account.address,
        to_address=recipient,
        value=0.01,
        nonce=nonce_mgr.get_nonce()  # Auto-increments
    )
    # Sign and send...

# Sync after errors
nonce_mgr.sync()
```

### Wait for Multiple Transactions

```python
# Send batch of transactions
tx_hashes = []
for i in range(5):
    tx_hash = w3.send_transaction(to='0x...', value_eth=0.01)
    tx_hashes.append(tx_hash)

# Wait for all to confirm
results = w3.gas_manager.wait_for_transaction_batch(
    tx_hashes,
    timeout=300  # 5 minutes
)

# Check results
for tx_hash, receipt in results:
    if receipt:
        print(f"{tx_hash[:8]}... {'✅' if receipt['status'] else '❌'}")
    else:
        print(f"{tx_hash[:8]}... ⏳ Still pending")
```

## Network Configurations

| Network  | Base Gas | Max Gas Price | Priority Fee | Notes |
|----------|----------|---------------|--------------|-------|
| Ethereum | 21,000   | 500 gwei      | 2 gwei       | EIP-1559 |
| Polygon  | 21,000   | 500 gwei      | 30 gwei      | High priority fees |
| Arbitrum | 21,000   | 10 gwei       | 0.1 gwei     | L2, low fees |
| BSC      | 21,000   | 50 gwei       | 1 gwei       | Stable fees |

## Gas Priority Levels

- **Slow**: 80% of standard priority fee, good for non-urgent transactions
- **Standard**: Network default priority fee
- **Fast**: 150% of standard, for important transactions
- **Instant**: 200% of standard, for urgent transactions

## Advanced Example: Optimized Transfers

```python
# See optimized_pingpong.py for a complete example
from utils import Web3Manager

def send_optimized_batch(recipient, count=10):
    w3 = Web3Manager('polygon')
    
    # Check if we can afford it
    balance = w3.get_balance()
    plan = w3.gas_manager.optimize_gas_for_batch(
        num_transactions=count,
        value_per_tx=0.01,
        balance=balance
    )
    
    if plan['recommended_count'] < count:
        print(f"⚠️ Can only send {plan['recommended_count']} transactions")
        count = plan['recommended_count']
    
    # Get nonce manager
    nonce_mgr = w3.gas_manager.get_nonce_manager(w3.account.address)
    
    # Send all transactions
    tx_hashes = []
    for i in range(count):
        tx = w3.gas_manager.build_transaction(
            from_address=w3.account.address,
            to_address=recipient,
            value=0.01,
            gas_priority='standard',
            nonce=nonce_mgr.get_nonce()
        )
        
        signed = w3.account.sign_transaction(tx)
        tx_hash = w3.w3.eth.send_raw_transaction(signed.raw)
        tx_hashes.append(tx_hash.hex())
        print(f"Sent {i+1}/{count}: {tx_hash.hex()[:16]}...")
    
    # Wait for confirmations
    results = w3.gas_manager.wait_for_transaction_batch(tx_hashes)
    
    successful = sum(1 for _, r in results if r and r['status'])
    print(f"\n✅ {successful}/{count} transactions confirmed!")
```

## Best Practices

1. **Always estimate before sending**: Use `optimize_gas_for_batch()` for multiple transactions
2. **Use appropriate priority**: Don't overpay for gas on non-urgent transactions
3. **Handle nonce errors**: Use `NonceManager` for sequential transactions
4. **Monitor gas prices**: Gas prices can spike; set appropriate limits
5. **Test on testnets**: Always test gas strategies on testnets first

## Integration with Safety Limits

The Gas Manager respects the hot wallet safety limits:
- Maximum gas price: 100 gwei (configurable)
- Automatic transaction value checks
- Integration with daily spending limits

---

The Gas Manager makes Web3 transactions more reliable and cost-effective by handling the complexity of gas estimation and pricing across different networks.