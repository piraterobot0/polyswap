#!/usr/bin/env python3
"""
Transfer ERC20 Tokens
Send tokens to another address
"""

import sys
import os
import json
import click
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from utils import Web3Manager
from web3 import Web3

@click.command()
@click.option('--network', default='sepolia', help='Network to use')
@click.option('--account', default=1, type=int, help='Account number to use (1 or 2)')
@click.option('--token', required=True, help='Token contract address')
@click.option('--to', required=True, help='Recipient address')
@click.option('--amount', required=True, type=float, help='Amount to transfer')
@click.option('--decimals', default=18, help='Token decimals (default: 18)')
def transfer_token(network, account, token, to, amount, decimals):
    """Transfer ERC20 tokens"""
    
    print("\n" + "="*50)
    print("💸 ERC20 TOKEN TRANSFER")
    print("="*50)
    print(f"Network: {network}")
    print(f"Token: {token}")
    print(f"To: {to}")
    print(f"Amount: {amount}")
    print("="*50 + "\n")
    
    # Initialize Web3 manager with selected account
    w3_manager = Web3Manager(network, account_number=account)
    
    # ERC20 ABI (minimal)
    erc20_abi = [
        {"inputs": [], "name": "name", "outputs": [{"type": "string"}], "type": "function", "constant": True},
        {"inputs": [], "name": "symbol", "outputs": [{"type": "string"}], "type": "function", "constant": True},
        {"inputs": [], "name": "decimals", "outputs": [{"type": "uint8"}], "type": "function", "constant": True},
        {"inputs": [{"type": "address"}], "name": "balanceOf", "outputs": [{"type": "uint256"}], "type": "function", "constant": True},
        {"inputs": [{"type": "address"}, {"type": "uint256"}], "name": "transfer", "outputs": [{"type": "bool"}], "type": "function"},
    ]
    
    # Get contract instance
    token_contract = w3_manager.get_contract(token, erc20_abi)
    
    try:
        # Get token info
        token_name = token_contract.functions.name().call()
        token_symbol = token_contract.functions.symbol().call()
        token_decimals = token_contract.functions.decimals().call()
        
        print(f"Token: {token_name} ({token_symbol})")
        print(f"Decimals: {token_decimals}")
        
        # Check balance
        balance_wei = token_contract.functions.balanceOf(w3_manager.account.address).call()
        balance = balance_wei / (10 ** token_decimals)
        print(f"Your balance: {balance:,.4f} {token_symbol}")
        
        # Calculate amount in wei
        amount_wei = int(amount * (10 ** token_decimals))
        
        if amount_wei > balance_wei:
            raise ValueError(f"Insufficient balance. You have {balance:,.4f} {token_symbol}")
        
        # Confirm transfer
        print(f"\n📤 Transfer {amount:,.4f} {token_symbol} to {to}?")
        confirm = input("Confirm (yes/no): ")
        
        if confirm.lower() != 'yes':
            print("❌ Transfer cancelled")
            return
        
        # Execute transfer
        print("\n🔄 Executing transfer...")
        tx_hash = w3_manager.call_function(
            contract_address=token,
            abi=erc20_abi,
            function_name='transfer',
            args=[w3_manager.w3.to_checksum_address(to), amount_wei]
        )
        
        print(f"📤 Transaction sent: {tx_hash}")
        print(f"Explorer: {w3_manager.get_explorer_url(tx_hash, 'tx')}")
        
        # Wait for confirmation
        print("\n⏳ Waiting for confirmation...")
        receipt = w3_manager.wait_for_transaction(tx_hash)
        
        if receipt['status'] == 1:
            print("\n✅ Transfer successful!")
            
            # Check new balance
            new_balance_wei = token_contract.functions.balanceOf(w3_manager.account.address).call()
            new_balance = new_balance_wei / (10 ** token_decimals)
            print(f"New balance: {new_balance:,.4f} {token_symbol}")
        else:
            print("\n❌ Transfer failed!")
            
    except Exception as e:
        print(f"\n❌ Transfer failed: {e}")

if __name__ == '__main__':
    transfer_token()