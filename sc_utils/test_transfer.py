#!/usr/bin/env python3
"""
Test Transfer Between Accounts
Send 0.01 MATIC from account 1 to account 2 on Polygon
"""

import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from utils import Web3Manager

def test_transfer():
    """Test sending 0.01 MATIC between accounts"""
    
    print("\n" + "="*60)
    print("🧪 TEST TRANSFER: 0.01 MATIC")
    print("="*60 + "\n")
    
    # Use Polygon network for MATIC
    network = 'polygon'
    amount = 0.01  # MATIC
    
    print("⚠️  This will send REAL MATIC on Polygon mainnet!")
    print("   Make sure you have MATIC in account 1")
    print("   Transaction will cost gas fees (~0.001 MATIC)")
    
    try:
        # Initialize with account 1 (sender)
        print("\n1️⃣ Loading Account #1 (Sender)...")
        w3 = Web3Manager(network, account_number=1)
        
        # Get account addresses
        sender_address = w3.accounts[1].address
        recipient_address = w3.accounts[2].address
        
        print(f"   From: {sender_address}")
        print(f"   To:   {recipient_address}")
        
        # Check balances before
        print("\n📊 Balances BEFORE transfer:")
        balance1_before = w3.get_balance(sender_address)
        balance2_before = w3.get_balance(recipient_address)
        print(f"   Account 1: {balance1_before:.6f} MATIC")
        print(f"   Account 2: {balance2_before:.6f} MATIC")
        
        # Check if account 1 has enough MATIC
        if balance1_before < 0.011:  # 0.01 + gas
            print(f"\n❌ Insufficient balance in Account 1!")
            print(f"   Need at least 0.011 MATIC (0.01 + gas)")
            print(f"   Current balance: {balance1_before:.6f} MATIC")
            return
        
        # Confirm transfer
        print(f"\n💸 Ready to send {amount} MATIC")
        print(f"   From Account #1 to Account #2")
        confirm = input("\nProceed with transfer? (yes/no): ")
        
        if confirm.lower() != 'yes':
            print("❌ Transfer cancelled")
            return
        
        # Send transaction
        print("\n🔄 Sending transaction...")
        tx_hash = w3.send_transaction(
            to=recipient_address,
            value_eth=amount  # Works for MATIC too
        )
        
        print(f"📤 Transaction sent: {tx_hash}")
        print(f"   Explorer: https://polygonscan.com/tx/{tx_hash}")
        
        # Wait for confirmation
        print("\n⏳ Waiting for confirmation (may take 30-60 seconds)...")
        receipt = w3.wait_for_transaction(tx_hash, timeout=180)
        
        if receipt['status'] == 1:
            print("✅ Transfer confirmed!")
            
            # Check balances after
            print("\n📊 Balances AFTER transfer:")
            balance1_after = w3.get_balance(sender_address)
            balance2_after = w3.get_balance(recipient_address)
            print(f"   Account 1: {balance1_after:.6f} MATIC (was {balance1_before:.6f})")
            print(f"   Account 2: {balance2_after:.6f} MATIC (was {balance2_before:.6f})")
            
            # Calculate actual amounts
            sent = balance1_before - balance1_after
            received = balance2_after - balance2_before
            gas_cost = sent - received
            
            print(f"\n📈 Summary:")
            print(f"   Sent: {sent:.6f} MATIC (including gas)")
            print(f"   Received: {received:.6f} MATIC")
            print(f"   Gas cost: {gas_cost:.6f} MATIC")
        else:
            print("❌ Transfer failed!")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure:")
        print("1. You have MATIC in Account #1")
        print("2. You've set POLYGON_RPC in .env file")
        print("3. Both private keys are correctly set in .env")

if __name__ == '__main__':
    print("\n⚠️  HOT WALLET WARNING")
    print("This is for testing with small amounts only!")
    print("Maximum recommended: $30 total value")
    
    test_transfer()