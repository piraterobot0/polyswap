#!/usr/bin/env python3
"""
Deploy ERC20 Token
⚠️ HOT WALLET MODE - Use testnets for development
"""

import sys
import os
import json
import click
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from utils import Web3Manager
from scripts.compile.compile_sol import compile_contract

@click.command()
@click.option('--network', default='sepolia', help='Network to deploy to')
@click.option('--account', default=1, type=int, help='Account number to use (1 or 2)')
@click.option('--name', prompt='Token name', help='Name of the token')
@click.option('--symbol', prompt='Token symbol', help='Symbol of the token')
@click.option('--decimals', default=18, help='Number of decimals')
@click.option('--supply', default=1000000, help='Initial supply')
def deploy_token(network, account, name, symbol, decimals, supply):
    """Deploy an ERC20 token"""
    
    print("\n" + "="*50)
    print("🚀 ERC20 TOKEN DEPLOYMENT")
    print("="*50)
    print(f"Network: {network}")
    print(f"Token: {name} ({symbol})")
    print(f"Decimals: {decimals}")
    print(f"Initial Supply: {supply:,}")
    print("="*50 + "\n")
    
    # Initialize Web3 manager with selected account
    w3_manager = Web3Manager(network, account_number=account)
    
    # Compile contract
    print("📝 Compiling contract...")
    contract_path = 'templates/ERC20.sol'
    compiled = compile_contract(contract_path, 'SimpleERC20')
    
    bytecode = compiled['bytecode']
    abi = compiled['abi']
    
    # Deploy contract
    print("\n🚀 Deploying contract...")
    constructor_args = [name, symbol, decimals, supply]
    
    try:
        contract_address, tx_hash = w3_manager.deploy_contract(
            bytecode=bytecode,
            abi=abi,
            constructor_args=constructor_args
        )
        
        print("\n" + "="*50)
        print("✅ DEPLOYMENT SUCCESSFUL")
        print("="*50)
        print(f"Token Address: {contract_address}")
        print(f"Transaction: {tx_hash}")
        print(f"Explorer: {w3_manager.get_explorer_url(contract_address, 'address')}")
        print("="*50)
        
        # Save deployment info
        deployment_info = {
            'name': name,
            'symbol': symbol,
            'decimals': decimals,
            'initial_supply': supply,
            'address': contract_address,
            'tx_hash': tx_hash,
            'network': network,
            'abi': abi
        }
        
        # Save to file
        os.makedirs('contracts/deployments', exist_ok=True)
        filename = f"contracts/deployments/{network}_{symbol.lower()}_token.json"
        with open(filename, 'w') as f:
            json.dump(deployment_info, f, indent=2)
        
        print(f"\n💾 Deployment info saved to {filename}")
        
        # Test the token
        print("\n🧪 Testing token...")
        contract = w3_manager.get_contract(contract_address, abi)
        
        # Check total supply
        total_supply = contract.functions.totalSupply().call()
        print(f"Total Supply: {total_supply / (10**decimals):,.0f} {symbol}")
        
        # Check deployer balance
        deployer_balance = contract.functions.balanceOf(w3_manager.account.address).call()
        print(f"Deployer Balance: {deployer_balance / (10**decimals):,.0f} {symbol}")
        
        return contract_address
        
    except Exception as e:
        print(f"\n❌ Deployment failed: {e}")
        return None

if __name__ == '__main__':
    deploy_token()