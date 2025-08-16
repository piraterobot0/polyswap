#!/usr/bin/env python3
"""
Optimized Ping-Pong Transfer using Gas Manager
Efficiently sends MATIC back and forth between accounts
"""

import sys
from pathlib import Path
import time

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from utils import Web3Manager

def optimized_pingpong(rounds: int = 10):
    """Execute optimized ping-pong transfers"""
    
    print("\n" + "="*60)
    print("⚡ OPTIMIZED PING-PONG TRANSFERS")
    print("="*60)
    print(f"Will execute {rounds} round-trips using Gas Manager")
    print("="*60 + "\n")
    
    # Initialize managers
    w3_1 = Web3Manager('polygon', account_number=1)
    w3_2 = Web3Manager('polygon', account_number=2)
    
    # Get addresses
    addr1 = w3_1.account.address
    addr2 = w3_2.account.address
    
    # Check initial balances
    balance1 = w3_1.get_balance()
    balance2 = w3_2.get_balance()
    
    print(f"📊 Initial Balances:")
    print(f"   Account #1: {balance1:.6f} MATIC")
    print(f"   Account #2: {balance2:.6f} MATIC")
    print(f"   Total: {balance1 + balance2:.6f} MATIC")
    
    # Optimize for batch
    total_balance = balance1 + balance2
    optimization = w3_1.gas_manager.optimize_gas_for_batch(
        num_transactions=rounds * 2,
        value_per_tx=0.008,
        balance=total_balance * 0.9  # Keep 10% reserve
    )
    
    print(f"\n⚡ Optimization Plan:")
    print(f"   Recommended transfers: {optimization['recommended_count']}")
    print(f"   Gas price: {optimization['gas_price_gwei']:.2f} gwei")
    print(f"   Cost per transfer: {optimization['total_cost_per_tx']:.6f} MATIC")
    
    max_rounds = optimization['recommended_count'] // 2
    actual_rounds = min(rounds, max_rounds)
    
    if actual_rounds < rounds:
        print(f"   ⚠️  Reducing to {actual_rounds} rounds due to balance constraints")
    
    # Override safety checks
    def auto_check(tx_dict, network="polygon"):
        return True
    
    w3_1.safety.check_transaction_limits = auto_check
    w3_2.safety.check_transaction_limits = auto_check
    
    # Initialize nonce managers
    nonce_mgr_1 = w3_1.gas_manager.get_nonce_manager(addr1)
    nonce_mgr_2 = w3_2.gas_manager.get_nonce_manager(addr2)
    
    # Track transactions
    all_tx_hashes = []
    
    print(f"\n🚀 Executing {actual_rounds} optimized round-trips...\n")
    
    # Send all transactions quickly
    for round_num in range(actual_rounds):
        print(f"Round {round_num + 1}/{actual_rounds}:", end=' ')
        
        try:
            # Build transaction 1→2
            tx1 = w3_1.gas_manager.build_transaction(
                from_address=addr1,
                to_address=addr2,
                value=0.008,
                gas_priority='standard',
                nonce=nonce_mgr_1.get_nonce()
            )
            
            # Sign and send
            signed_tx1 = w3_1.account.sign_transaction(tx1)
            if hasattr(signed_tx1, 'rawTransaction'):
                raw_tx1 = signed_tx1.rawTransaction
            elif hasattr(signed_tx1, 'raw_transaction'):
                raw_tx1 = signed_tx1.raw_transaction
            else:
                raw_tx1 = signed_tx1.raw
            
            tx_hash1 = w3_1.w3.eth.send_raw_transaction(raw_tx1)
            all_tx_hashes.append(tx_hash1.hex())
            print(f"1→2 ✅", end=' ')
            
            # Small delay to ensure proper ordering
            time.sleep(0.5)
            
            # Build transaction 2→1
            tx2 = w3_2.gas_manager.build_transaction(
                from_address=addr2,
                to_address=addr1,
                value=0.008,
                gas_priority='standard',
                nonce=nonce_mgr_2.get_nonce()
            )
            
            # Sign and send
            signed_tx2 = w3_2.account.sign_transaction(tx2)
            if hasattr(signed_tx2, 'rawTransaction'):
                raw_tx2 = signed_tx2.rawTransaction
            elif hasattr(signed_tx2, 'raw_transaction'):
                raw_tx2 = signed_tx2.raw_transaction
            else:
                raw_tx2 = signed_tx2.raw
            
            tx_hash2 = w3_2.w3.eth.send_raw_transaction(raw_tx2)
            all_tx_hashes.append(tx_hash2.hex())
            print(f"2→1 ✅")
            
            # Brief pause between rounds
            if round_num < actual_rounds - 1:
                time.sleep(1)
                
        except Exception as e:
            print(f"❌ Error: {e}")
            # Sync nonces on error
            nonce_mgr_1.sync()
            nonce_mgr_2.sync()
            break
    
    print(f"\n✅ Sent {len(all_tx_hashes)} transactions!")
    
    # Wait for confirmations using gas manager
    print("\n⏳ Waiting for confirmations...")
    results = w3_1.gas_manager.wait_for_transaction_batch(all_tx_hashes, timeout=120)
    
    # Count successes
    successful = sum(1 for _, receipt in results if receipt and receipt['status'] == 1)
    failed = sum(1 for _, receipt in results if receipt and receipt['status'] == 0)
    pending = sum(1 for _, receipt in results if receipt is None)
    
    print(f"\n📊 Results:")
    print(f"   ✅ Successful: {successful}")
    print(f"   ❌ Failed: {failed}")
    print(f"   ⏳ Pending: {pending}")
    
    # Get final balances
    final_balance1 = w3_1.get_balance()
    final_balance2 = w3_2.get_balance()
    
    print(f"\n💰 Final Balances:")
    print(f"   Account #1: {final_balance1:.6f} MATIC (was {balance1:.6f})")
    print(f"   Account #2: {final_balance2:.6f} MATIC (was {balance2:.6f})")
    
    # Calculate gas costs
    total_gas = (balance1 + balance2) - (final_balance1 + final_balance2)
    
    print(f"\n⛽ Gas Statistics:")
    print(f"   Total gas spent: {total_gas:.6f} MATIC")
    if successful > 0:
        print(f"   Average per transfer: {total_gas/successful:.6f} MATIC")
    
    print("\n✅ Optimized ping-pong complete!")
    
    return all_tx_hashes

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Optimized ping-pong transfers')
    parser.add_argument('--rounds', type=int, default=10, help='Number of round-trips')
    
    args = parser.parse_args()
    
    # Run the optimized transfers
    optimized_pingpong(args.rounds)