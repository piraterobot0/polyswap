#!/usr/bin/env python3
"""
Gas Manager Demo
Demonstrates how to use the gas management utilities
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from utils import Web3Manager, GasManager

def demo_gas_manager():
    """Demonstrate gas manager features"""
    
    print("\n" + "="*60)
    print("⛽ GAS MANAGER DEMO")
    print("="*60 + "\n")
    
    # Initialize Web3 and Gas Manager
    w3_manager = Web3Manager('polygon')
    gas_manager = GasManager(w3_manager.w3, 'polygon')
    
    # 1. Get current gas prices
    print("1️⃣ Current Gas Prices:")
    print("-" * 40)
    
    for priority in ['slow', 'standard', 'fast', 'instant']:
        gas_config = gas_manager.get_gas_price(priority)
        if 'gasPrice' in gas_config:
            gas_gwei = w3_manager.w3.from_wei(gas_config['gasPrice'], 'gwei')
            print(f"   {priority.capitalize()}: {gas_gwei:.2f} gwei")
        else:
            max_fee_gwei = w3_manager.w3.from_wei(gas_config['maxFeePerGas'], 'gwei')
            priority_fee_gwei = w3_manager.w3.from_wei(gas_config['maxPriorityFeePerGas'], 'gwei')
            print(f"   {priority.capitalize()}: Max {max_fee_gwei:.2f} gwei, Priority {priority_fee_gwei:.2f} gwei")
    
    # 2. Estimate transaction costs
    print("\n2️⃣ Transaction Cost Estimates:")
    print("-" * 40)
    
    # Simple transfer
    simple_tx = {
        'from': w3_manager.account.address,
        'to': w3_manager.account.address,
        'value': w3_manager.w3.to_wei(0.01, 'ether')
    }
    
    gas_limit = gas_manager.estimate_gas(simple_tx)
    cost = gas_manager.calculate_transaction_cost(gas_limit)
    
    print(f"   Simple Transfer (0.01 MATIC):")
    print(f"   - Gas Limit: {gas_limit:,}")
    print(f"   - Gas Price: {cost['gas_price_gwei']:.2f} gwei")
    print(f"   - Cost: {cost['cost_eth']:.6f} MATIC (~${cost['cost_usd']:.4f})")
    
    # 3. Build optimized transaction
    print("\n3️⃣ Build Optimized Transaction:")
    print("-" * 40)
    
    optimized_tx = gas_manager.build_transaction(
        from_address=w3_manager.account.address,
        to_address=w3_manager.accounts[2].address,
        value=0.01,
        gas_priority='fast'
    )
    
    print("   Transaction built with:")
    print(f"   - Nonce: {optimized_tx['nonce']}")
    print(f"   - Gas Limit: {optimized_tx['gas']:,}")
    if 'gasPrice' in optimized_tx:
        print(f"   - Gas Price: {w3_manager.w3.from_wei(optimized_tx['gasPrice'], 'gwei'):.2f} gwei")
    else:
        print(f"   - Max Fee: {w3_manager.w3.from_wei(optimized_tx['maxFeePerGas'], 'gwei'):.2f} gwei")
    
    # 4. Batch optimization
    print("\n4️⃣ Batch Transaction Optimization:")
    print("-" * 40)
    
    balance = w3_manager.get_balance()
    batch_plan = gas_manager.optimize_gas_for_batch(
        num_transactions=20,
        value_per_tx=0.01,
        balance=balance
    )
    
    print(f"   Current Balance: {balance:.6f} MATIC")
    print(f"   Planned Transactions: 20")
    print(f"   Value per TX: {batch_plan['value_per_tx']} MATIC")
    print(f"   Gas Cost per TX: {batch_plan['gas_cost_per_tx']:.6f} MATIC")
    print(f"   ")
    print(f"   ✅ Can Execute: {batch_plan['recommended_count']} transactions")
    print(f"   💰 Total Cost: {batch_plan['total_cost']:.6f} MATIC")
    print(f"   ⛽ Total Gas: {batch_plan['total_gas_cost']:.6f} MATIC")
    print(f"   📊 Remaining: {batch_plan['remaining_balance']:.6f} MATIC")
    
    # 5. Nonce management
    print("\n5️⃣ Nonce Management:")
    print("-" * 40)
    
    nonce_mgr = gas_manager.get_nonce_manager(w3_manager.account.address)
    
    print(f"   Current Nonce: {nonce_mgr.current_nonce}")
    print("   Getting sequential nonces:")
    for i in range(5):
        nonce = nonce_mgr.get_nonce()
        print(f"   - Transaction {i+1}: nonce {nonce}")
    
    print(f"   Next nonce would be: {nonce_mgr.current_nonce}")
    
    # 6. Network comparison
    print("\n6️⃣ Network Gas Comparison:")
    print("-" * 40)
    
    networks = ['ethereum', 'polygon', 'arbitrum', 'bsc']
    
    print("   Network    | Base Gas | Max Gas Price | Priority Fee")
    print("   -----------|----------|---------------|-------------")
    
    for network in networks:
        gm = GasManager(w3_manager.w3, network)
        config = gm.config
        print(f"   {network:<10} | {config['base_gas']:>8,} | {config['max_gas_price']:>10} gwei | {config['priority_fee']:>10} gwei")
    
    print("\n✅ Gas Manager Demo Complete!")
    print("   Use these utilities to optimize your transaction costs")
    print("="*60)

if __name__ == '__main__':
    demo_gas_manager()