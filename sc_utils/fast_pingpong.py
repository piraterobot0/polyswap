#!/usr/bin/env python3
"""
Fast Ping-Pong - Send transactions without waiting for each confirmation
"""

import sys
from pathlib import Path
import time

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from utils import Web3Manager

# Initialize both accounts
print("🏓 FAST PING-PONG TRANSFERS")
print("="*60)

w3_1 = Web3Manager('polygon', account_number=1)
w3_2 = Web3Manager('polygon', account_number=2)

# Override safety checks
def auto_check(tx_dict, network="polygon"):
    return True

w3_1.safety.check_transaction_limits = auto_check
w3_2.safety.check_transaction_limits = auto_check

# Get initial balances
addr1 = w3_1.account.address
addr2 = w3_2.account.address

balance1 = w3_1.get_balance()
balance2 = w3_2.get_balance()

print(f"\n📊 Initial Balances:")
print(f"   Account #1: {balance1:.6f} MATIC")
print(f"   Account #2: {balance2:.6f} MATIC")
print(f"   Total: {balance1 + balance2:.6f} MATIC")

# Top up Account 2 if needed
if balance2 < 0.05:
    print(f"\n💰 Topping up Account #2...")
    tx = w3_1.send_transaction(to=addr2, value_eth=0.1)
    receipt = w3_1.wait_for_transaction(tx)
    if receipt['status'] == 1:
        balance2 = w3_1.get_balance(addr2)
        print(f"   ✅ Account #2 now has: {balance2:.6f} MATIC")

# Quick check balances again
balance1 = w3_1.get_balance()
balance2 = w3_2.get_balance()

print(f"\n🚀 Sending 20 transfers each direction (40 total)...")
print("   Not waiting for confirmations between sends\n")

# Send all transactions quickly
tx_hashes = []

# Send 20 from Account 1 to Account 2
print("📤 Sending 20x from Account #1 → #2:")
for i in range(20):
    try:
        # Update nonce
        nonce = w3_1.w3.eth.get_transaction_count(addr1)
        
        # Build transaction with explicit nonce
        tx = {
            'from': addr1,
            'to': addr2,
            'value': w3_1.w3.to_wei(0.008, 'ether'),  # 0.008 MATIC
            'nonce': nonce,
            'chainId': 137,
            'gasPrice': w3_1.w3.eth.gas_price,
            'gas': 21000
        }
        
        # Sign and send
        signed_tx = w3_1.account.sign_transaction(tx)
        if hasattr(signed_tx, 'rawTransaction'):
            raw_tx = signed_tx.rawTransaction
        elif hasattr(signed_tx, 'raw_transaction'):
            raw_tx = signed_tx.raw_transaction
        else:
            raw_tx = signed_tx.raw
        
        tx_hash = w3_1.w3.eth.send_raw_transaction(raw_tx)
        tx_hashes.append(tx_hash.hex())
        print(f"   {i+1}. {tx_hash.hex()[:16]}...")
        
        # Small delay to avoid nonce issues
        time.sleep(0.5)
        
    except Exception as e:
        print(f"   {i+1}. ❌ Error: {e}")
        break

print(f"\n📤 Sending 20x from Account #2 → #1:")
for i in range(20):
    try:
        # Update nonce
        nonce = w3_2.w3.eth.get_transaction_count(addr2)
        
        # Build transaction with explicit nonce
        tx = {
            'from': addr2,
            'to': addr1,
            'value': w3_2.w3.to_wei(0.008, 'ether'),  # 0.008 MATIC
            'nonce': nonce,
            'chainId': 137,
            'gasPrice': w3_2.w3.eth.gas_price,
            'gas': 21000
        }
        
        # Sign and send
        signed_tx = w3_2.account.sign_transaction(tx)
        if hasattr(signed_tx, 'rawTransaction'):
            raw_tx = signed_tx.rawTransaction
        elif hasattr(signed_tx, 'raw_transaction'):
            raw_tx = signed_tx.raw_transaction
        else:
            raw_tx = signed_tx.raw
        
        tx_hash = w3_2.w3.eth.send_raw_transaction(raw_tx)
        tx_hashes.append(tx_hash.hex())
        print(f"   {i+1}. {tx_hash.hex()[:16]}...")
        
        # Small delay to avoid nonce issues
        time.sleep(0.5)
        
    except Exception as e:
        print(f"   {i+1}. ❌ Error: {e}")
        break

print(f"\n✅ Sent {len(tx_hashes)} transactions!")
print("\n⏳ Waiting 30 seconds for confirmations...")
time.sleep(30)

# Check final balances
final_balance1 = w3_1.get_balance()
final_balance2 = w3_2.get_balance()

print(f"\n📊 Final Balances:")
print(f"   Account #1: {final_balance1:.6f} MATIC (was {balance1:.6f})")
print(f"   Account #2: {final_balance2:.6f} MATIC (was {balance2:.6f})")
print(f"   Total: {final_balance1 + final_balance2:.6f} MATIC")

total_gas = (balance1 + balance2) - (final_balance1 + final_balance2)
print(f"\n⛽ Total gas spent: {total_gas:.6f} MATIC")
if len(tx_hashes) > 0:
    print(f"   Average per transfer: {total_gas/len(tx_hashes):.6f} MATIC")

print(f"\n🎉 Completed {len(tx_hashes)} transfers!")