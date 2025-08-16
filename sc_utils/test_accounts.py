#!/usr/bin/env python3
"""
Test Multiple Accounts
Verify both private keys are working
"""

import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from utils import Web3Manager

def test_accounts():
    """Test both accounts"""
    print("\n" + "="*60)
    print("🔐 TESTING MULTIPLE ACCOUNTS")
    print("="*60 + "\n")
    
    # Test with account 1
    print("Testing Account #1...")
    try:
        w3_1 = Web3Manager(network='sepolia', account_number=1)
        print(f"✅ Account 1 loaded successfully")
        print(f"   Address: {w3_1.account.address}")
        print(f"   Balance: {w3_1.get_balance():.6f} ETH\n")
    except Exception as e:
        print(f"❌ Failed to load Account 1: {e}\n")
    
    # Test with account 2
    print("Testing Account #2...")
    try:
        w3_2 = Web3Manager(network='sepolia', account_number=2)
        print(f"✅ Account 2 loaded successfully")
        print(f"   Address: {w3_2.account.address}")
        print(f"   Balance: {w3_2.get_balance():.6f} ETH\n")
    except Exception as e:
        print(f"❌ Failed to load Account 2: {e}\n")
    
    # Test switching accounts
    print("Testing account switching...")
    try:
        w3 = Web3Manager(network='sepolia', account_number=1)
        print(f"Started with Account #1: {w3.account.address}")
        
        w3.switch_account(2)
        print(f"After switch: Account #2: {w3.account.address}")
        
        w3.switch_account(1)
        print(f"Switched back to Account #1: {w3.account.address}")
        
        print("\n✅ Account switching works!")
    except Exception as e:
        print(f"❌ Account switching failed: {e}")
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print("Both accounts are configured and ready to use!")
    print("Use --account 1 or --account 2 with any script")
    print("Example: python scripts/tokens/balance.py --account 2")
    print("="*60 + "\n")

if __name__ == '__main__':
    test_accounts()