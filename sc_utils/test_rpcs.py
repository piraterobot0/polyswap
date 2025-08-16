#!/usr/bin/env python3
"""
Test RPC Connections
Verify public and private RPC configurations work
"""

import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from utils import Web3Manager

def test_rpcs():
    """Test RPC connections for different networks"""
    print("\n" + "="*60)
    print("🌐 TESTING RPC CONNECTIONS")
    print("="*60 + "\n")
    
    networks_to_test = ['polygon', 'sepolia', 'mumbai']
    
    for network in networks_to_test:
        print(f"\n📡 Testing {network.upper()}...")
        print("-" * 40)
        
        try:
            # Try to connect (will use private RPC if available, else public)
            w3 = Web3Manager(network, account_number=1)
            
            # Get network info
            chain_id = w3.w3.eth.chain_id
            block_number = w3.w3.eth.block_number
            gas_price = w3.w3.eth.gas_price
            
            print(f"✅ Connected successfully!")
            print(f"   Chain ID: {chain_id}")
            print(f"   Latest block: {block_number:,}")
            print(f"   Gas price: {gas_price / 10**9:.2f} gwei")
            
            # Show account info
            try:
                balance = w3.get_balance()
                print(f"   Account balance: {balance:.6f} {w3.networks_config['networks'][network].get('currency', 'ETH')}")
            except Exception as e:
                print(f"   Account check: {e}")
                
        except Exception as e:
            print(f"❌ Failed to connect: {e}")
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print("\n📋 RPC Configuration:")
    print("• Private RPCs: Set in .env file (optional)")
    print("• Public RPCs: Configured in config/public_rpcs.json")
    print("• System uses private first, then falls back to public")
    print("\n💡 For better performance, add private RPCs to .env:")
    print("   POLYGON_RPC=https://polygon-mainnet.g.alchemy.com/v2/YOUR-KEY")
    print("   SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/YOUR-KEY")
    print("="*60 + "\n")

if __name__ == '__main__':
    test_rpcs()