#!/usr/bin/env python3
"""
Send Native Token (ETH/MATIC/BNB)
Send native tokens between addresses
"""

import sys
import click
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from utils import Web3Manager
from web3 import Web3

@click.command()
@click.option('--network', default='polygon', help='Network to use')
@click.option('--from-account', 'from_acc', default=1, type=int, help='Account to send from (1 or 2)')
@click.option('--to', help='Recipient address (or account:1/account:2 for your accounts)')
@click.option('--amount', required=True, type=float, help='Amount to send')
def send_native(network, from_acc, to, amount):
    """Send native tokens (ETH/MATIC/BNB)"""
    
    print("\n" + "="*50)
    print("💸 NATIVE TOKEN TRANSFER")
    print("="*50)
    print(f"Network: {network}")
    print(f"From Account: #{from_acc}")
    print(f"Amount: {amount}")
    
    # Initialize Web3 manager with sender account
    w3_manager = Web3Manager(network, account_number=from_acc)
    
    # Handle special "account:X" syntax for recipient
    if to and to.startswith('account:'):
        account_num = int(to.split(':')[1])
        to_address = w3_manager.accounts[account_num].address
        print(f"To: Account #{account_num} ({to_address})")
    elif to:
        to_address = w3_manager.w3.to_checksum_address(to)
        print(f"To: {to_address}")
    else:
        # Default: send to the other account
        other_account = 2 if from_acc == 1 else 1
        to_address = w3_manager.accounts[other_account].address
        print(f"To: Account #{other_account} ({to_address})")
    
    print("="*50 + "\n")
    
    # Get currency name
    currency = w3_manager.networks_config['networks'][network].get('currency', 'ETH')
    
    # Check sender balance
    sender_balance = w3_manager.get_balance()
    print(f"Sender balance: {sender_balance:.6f} {currency}")
    
    if sender_balance < amount:
        print(f"❌ Insufficient balance! You have {sender_balance:.6f} {currency}")
        return
    
    # Show recipient balance before
    recipient_balance_before = w3_manager.get_balance(to_address)
    print(f"Recipient balance: {recipient_balance_before:.6f} {currency}")
    
    # Estimate gas cost
    gas_price = w3_manager.w3.eth.gas_price
    gas_limit = 21000  # Standard transfer
    gas_cost = w3_manager.w3.from_wei(gas_price * gas_limit, 'ether')
    total_cost = amount + float(gas_cost)
    
    print(f"\n📊 Transaction Details:")
    print(f"  Amount: {amount:.6f} {currency}")
    print(f"  Estimated gas: {gas_cost:.6f} {currency}")
    print(f"  Total cost: {total_cost:.6f} {currency}")
    
    if total_cost > sender_balance:
        print(f"\n❌ Insufficient balance for gas! Need {total_cost:.6f} {currency}")
        return
    
    # Confirm
    print(f"\n⚠️  Send {amount:.6f} {currency} from Account #{from_acc} to {to_address}?")
    confirm = input("Confirm (yes/no): ")
    
    if confirm.lower() != 'yes':
        print("❌ Transfer cancelled")
        return
    
    try:
        # Send transaction
        print("\n🔄 Sending transaction...")
        tx_hash = w3_manager.send_transaction(
            to=to_address,
            value_eth=amount
        )
        
        print(f"📤 Transaction sent: {tx_hash}")
        print(f"Explorer: {w3_manager.get_explorer_url(tx_hash, 'tx')}")
        
        # Wait for confirmation
        print("\n⏳ Waiting for confirmation...")
        receipt = w3_manager.wait_for_transaction(tx_hash)
        
        if receipt['status'] == 1:
            print("\n✅ Transfer successful!")
            
            # Check new balances
            sender_balance_after = w3_manager.get_balance()
            recipient_balance_after = w3_manager.get_balance(to_address)
            
            print(f"\n📊 Final Balances:")
            print(f"  Sender: {sender_balance_after:.6f} {currency} (was {sender_balance:.6f})")
            print(f"  Recipient: {recipient_balance_after:.6f} {currency} (was {recipient_balance_before:.6f})")
            
            gas_used = receipt['gasUsed']
            actual_gas_cost = w3_manager.w3.from_wei(gas_used * gas_price, 'ether')
            print(f"  Gas used: {actual_gas_cost:.6f} {currency}")
        else:
            print("\n❌ Transfer failed!")
            
    except Exception as e:
        print(f"\n❌ Transfer failed: {e}")

if __name__ == '__main__':
    send_native()