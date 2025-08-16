#!/usr/bin/env python3
"""
Demo Transfer - Non-interactive
Shows how the transfer would work without requiring input
"""

import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from utils import Web3Manager

def demo_transfer():
    """Demo transfer between accounts"""
    
    print("\n" + "="*60)
    print("📺 DEMO: Transfer 0.01 MATIC Between Accounts")
    print("="*60 + "\n")
    
    # Use Polygon network for MATIC
    network = 'polygon'
    amount = 0.01  # MATIC
    
    try:
        # Initialize with account 1 (sender)
        print("1️⃣ Loading Account #1 (Sender)...")
        w3 = Web3Manager(network, account_number=1)
        
        # Get account addresses
        sender_address = w3.accounts[1].address
        recipient_address = w3.accounts[2].address
        
        print(f"\n📬 Addresses:")
        print(f"   From (Account #1): {sender_address}")
        print(f"   To (Account #2):   {recipient_address}")
        
        # Check balances before
        print("\n📊 Current Balances:")
        balance1 = w3.get_balance(sender_address)
        balance2 = w3.get_balance(recipient_address)
        print(f"   Account 1: {balance1:.6f} MATIC")
        print(f"   Account 2: {balance2:.6f} MATIC")
        
        # Check if account 1 has enough MATIC
        if balance1 < 0.011:  # 0.01 + gas
            print(f"\n❌ Insufficient balance in Account 1!")
            print(f"   Need at least 0.011 MATIC (0.01 + gas)")
            print(f"   Current balance: {balance1:.6f} MATIC")
            return
        
        # Estimate gas
        gas_price = w3.w3.eth.gas_price
        gas_limit = 21000  # Standard transfer
        gas_cost_wei = gas_price * gas_limit
        gas_cost = w3.w3.from_wei(gas_cost_wei, 'ether')
        
        print(f"\n💸 Transfer Details:")
        print(f"   Amount to send: {amount} MATIC")
        print(f"   Estimated gas: {gas_cost:.6f} MATIC")
        print(f"   Total cost: {amount + float(gas_cost):.6f} MATIC")
        print(f"   Gas price: {w3.w3.from_wei(gas_price, 'gwei'):.2f} gwei")
        
        print("\n📝 To execute this transfer, run:")
        print("   python3 test_transfer.py")
        print("   OR")
        print("   python3 scripts/interact/send_native.py --from-account 1 --amount 0.01")
        
        print("\n✅ Everything is ready for the transfer!")
        print("   - Account #1 has sufficient MATIC")
        print("   - Both accounts are properly configured")
        print("   - RPC connection is working")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nTroubleshooting:")
        print("1. Check that POLYGON_RPC is set in .env (or using public RPC)")
        print("2. Ensure both private keys are correctly set")
        print("3. Verify Account #1 has at least 0.011 MATIC")

if __name__ == '__main__':
    demo_transfer()