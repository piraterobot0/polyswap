#!/usr/bin/env python3
"""
Call Smart Contract Functions
Interact with any deployed smart contract
"""

import sys
import os
import json
import click
from pathlib import Path
from typing import Any

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from utils import Web3Manager
from web3 import Web3

# Create Web3 instance for utilities
w3_utils = Web3()

def parse_arg(arg: str) -> Any:
    """Parse command line argument to appropriate type"""
    # Check if it's a boolean
    if arg.lower() in ['true', 'false']:
        return arg.lower() == 'true'
    
    # Check if it's a number
    try:
        if '.' in arg:
            return float(arg)
        return int(arg)
    except ValueError:
        pass
    
    # Check if it's an address
    if arg.startswith('0x') and len(arg) == 42:
        return w3_utils.to_checksum_address(arg)
    
    # Return as string
    return arg

@click.command()
@click.option('--network', default='sepolia', help='Network to use')
@click.option('--account', default=1, type=int, help='Account number to use (1 or 2)')
@click.option('--contract', required=True, help='Contract address')
@click.option('--abi-file', help='Path to ABI JSON file')
@click.option('--function', required=True, help='Function name to call')
@click.option('--args', multiple=True, help='Function arguments')
@click.option('--value', default=0, help='ETH value to send (for payable functions)')
def call_function(network, account, contract, abi_file, function, args, value):
    """Call a smart contract function"""
    
    print("\n" + "="*50)
    print("📞 SMART CONTRACT INTERACTION")
    print("="*50)
    print(f"Network: {network}")
    print(f"Contract: {contract}")
    print(f"Function: {function}")
    if args:
        print(f"Arguments: {args}")
    if value > 0:
        print(f"Value: {value} ETH")
    print("="*50 + "\n")
    
    # Initialize Web3 manager with selected account
    w3_manager = Web3Manager(network, account_number=account)
    
    # Load ABI
    if abi_file:
        with open(abi_file, 'r') as f:
            abi = json.load(f)
            if 'abi' in abi:  # Handle compiled contract format
                abi = abi['abi']
    else:
        # Try to find ABI in deployments
        deployment_files = Path('contracts/deployments').glob(f"{network}*{contract[:8]}*.json")
        deployment_file = next(deployment_files, None)
        
        if deployment_file:
            with open(deployment_file, 'r') as f:
                deployment = json.load(f)
                abi = deployment['abi']
            print(f"📄 Loaded ABI from {deployment_file}")
        else:
            # Try common ABIs
            print("⚠️  No ABI file provided, using minimal ERC20 ABI")
            abi = [
                {"inputs": [], "name": "name", "outputs": [{"type": "string"}], "type": "function", "constant": True},
                {"inputs": [], "name": "symbol", "outputs": [{"type": "string"}], "type": "function", "constant": True},
                {"inputs": [], "name": "decimals", "outputs": [{"type": "uint8"}], "type": "function", "constant": True},
                {"inputs": [], "name": "totalSupply", "outputs": [{"type": "uint256"}], "type": "function", "constant": True},
                {"inputs": [{"type": "address"}], "name": "balanceOf", "outputs": [{"type": "uint256"}], "type": "function", "constant": True},
                {"inputs": [{"type": "address"}, {"type": "uint256"}], "name": "transfer", "outputs": [{"type": "bool"}], "type": "function"},
                {"inputs": [{"type": "address"}, {"type": "uint256"}], "name": "approve", "outputs": [{"type": "bool"}], "type": "function"},
                {"inputs": [{"type": "address"}, {"type": "address"}, {"type": "uint256"}], "name": "transferFrom", "outputs": [{"type": "bool"}], "type": "function"},
            ]
    
    # Parse arguments
    parsed_args = [parse_arg(arg) for arg in args] if args else []
    
    try:
        # Call function
        result = w3_manager.call_function(
            contract_address=contract,
            abi=abi,
            function_name=function,
            args=parsed_args,
            value_eth=value
        )
        
        print("\n" + "="*50)
        print("✅ INTERACTION SUCCESSFUL")
        print("="*50)
        
        if isinstance(result, str) and result.startswith('0x') and len(result) == 66:
            # It's a transaction hash
            print(f"Transaction: {result}")
            print(f"Explorer: {w3_manager.get_explorer_url(result, 'tx')}")
            
            # Wait for confirmation
            print("\n⏳ Waiting for confirmation...")
            receipt = w3_manager.wait_for_transaction(result)
            print(f"Gas used: {receipt['gasUsed']:,}")
        else:
            # It's a return value
            print(f"Result: {result}")
        
        print("="*50)
        
    except Exception as e:
        print(f"\n❌ Interaction failed: {e}")

if __name__ == '__main__':
    call_function()