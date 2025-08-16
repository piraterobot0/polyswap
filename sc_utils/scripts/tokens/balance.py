#!/usr/bin/env python3
"""
Check Token Balances
Check ERC20 token and native token balances
"""

import sys
import json
import click
from pathlib import Path
from tabulate import tabulate

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from utils import Web3Manager
from web3 import Web3

@click.command()
@click.option('--network', default='sepolia', help='Network to use')
@click.option('--account', default=1, type=int, help='Account number to use (1 or 2)')
@click.option('--address', help='Address to check (default: your address)')
@click.option('--tokens', multiple=True, help='Token contract addresses to check')
def check_balance(network, account, address, tokens):
    """Check token balances"""
    
    print("\n" + "="*50)
    print("💰 BALANCE CHECK")
    print("="*50)
    
    # Initialize Web3 manager with selected account
    w3_manager = Web3Manager(network, account_number=account)
    
    # Option to check all accounts
    if address == 'all':
        print("Checking all accounts...\n")
        w3_manager.get_all_balances()
        return
    
    # Use provided address or default to account address
    check_address = address if address else w3_manager.account.address
    print(f"Address: {check_address}")
    print(f"Network: {network}")
    print("="*50 + "\n")
    
    balances = []
    
    # Check native token balance
    native_balance = w3_manager.get_balance(check_address)
    currency = w3_manager.networks_config['networks'][network].get('currency', 'ETH')
    balances.append([currency, "Native", f"{native_balance:,.6f}"])
    
    # ERC20 ABI (minimal)
    erc20_abi = [
        {"inputs": [], "name": "name", "outputs": [{"type": "string"}], "type": "function", "constant": True},
        {"inputs": [], "name": "symbol", "outputs": [{"type": "string"}], "type": "function", "constant": True},
        {"inputs": [], "name": "decimals", "outputs": [{"type": "uint8"}], "type": "function", "constant": True},
        {"inputs": [{"type": "address"}], "name": "balanceOf", "outputs": [{"type": "uint256"}], "type": "function", "constant": True},
    ]
    
    # Check token balances
    for token_address in tokens:
        try:
            token_contract = w3_manager.get_contract(token_address, erc20_abi)
            
            # Get token info
            try:
                token_name = token_contract.functions.name().call()
                token_symbol = token_contract.functions.symbol().call()
                token_decimals = token_contract.functions.decimals().call()
            except:
                token_name = "Unknown"
                token_symbol = token_address[:8] + "..."
                token_decimals = 18
            
            # Get balance
            balance_wei = token_contract.functions.balanceOf(check_address).call()
            balance = balance_wei / (10 ** token_decimals)
            
            balances.append([token_symbol, token_name, f"{balance:,.6f}"])
            
        except Exception as e:
            balances.append([token_address[:8] + "...", "Error", str(e)[:30]])
    
    # Display balances
    print(tabulate(balances, headers=["Symbol", "Name", "Balance"], tablefmt="grid"))
    
    # Check for common tokens if no specific tokens provided
    if not tokens:
        print("\n💡 Tip: Specify token addresses to check ERC20 balances")
        print("   Example: --tokens 0x... --tokens 0x...")

if __name__ == '__main__':
    check_balance()