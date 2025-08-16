#!/usr/bin/env python3
"""
Deploy Generated Token
Deploy ERC-20 tokens created by the generator
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
@click.argument('params_file', type=click.Path(exists=True))
@click.option('--network', default='sepolia', help='Network to deploy to')
@click.option('--account', default=1, type=int, help='Account number to use (1 or 2)')
@click.option('--verify', is_flag=True, help='Verify contract after deployment')
def deploy_generated_token(params_file, network, account, verify):
    """Deploy a generated ERC-20 token using its params file"""
    
    print("\n" + "="*60)
    print("🚀 DEPLOY GENERATED TOKEN")
    print("="*60)
    
    # Load parameters
    with open(params_file, 'r') as f:
        params = json.load(f)
    
    # Get contract file
    contract_file = params_file.replace('_params.json', '.sol')
    if not os.path.exists(contract_file):
        print(f"❌ Contract file not found: {contract_file}")
        return
    
    print(f"\n📋 Token Details:")
    print(f"   Template: {params['template']}")
    print(f"   Contract: {params['contract_name']}")
    if 'constructor_args' in params:
        args = params['constructor_args']
        if 'name' in args:
            print(f"   Name: {args['name']}")
            print(f"   Symbol: {args['symbol']}")
            print(f"   Decimals: {args['decimals']}")
            print(f"   Initial Supply: {args['initialSupply']:,}")
    else:
        print(f"   Initial Supply: {params.get('initialSupply', 0):,}")
    
    if 'cap' in params:
        print(f"   Max Supply Cap: {params['cap']:,}")
    
    print(f"\n🌐 Deployment Configuration:")
    print(f"   Network: {network}")
    print(f"   Account: #{account}")
    print(f"   Contract File: {contract_file}")
    
    # Initialize Web3 manager
    w3_manager = Web3Manager(network, account_number=account)
    
    # Check gas costs
    print(f"\n⛽ Gas Estimation:")
    gas_price = w3_manager.gas_manager.get_gas_price('standard')
    if 'gasPrice' in gas_price:
        gas_gwei = w3_manager.w3.from_wei(gas_price['gasPrice'], 'gwei')
    else:
        gas_gwei = w3_manager.w3.from_wei(gas_price['maxFeePerGas'], 'gwei')
    
    estimated_gas = 1500000  # Typical for token deployment
    deployment_cost = w3_manager.gas_manager.calculate_transaction_cost(estimated_gas)
    
    print(f"   Gas Price: {gas_gwei:.2f} gwei")
    print(f"   Estimated Gas: {estimated_gas:,}")
    print(f"   Estimated Cost: {deployment_cost['cost_eth']:.6f} ETH (~${deployment_cost['cost_usd']:.2f})")
    
    # Check balance
    balance = w3_manager.get_balance()
    if balance < deployment_cost['cost_eth'] * 1.2:  # 20% buffer
        print(f"\n❌ Insufficient balance!")
        print(f"   Balance: {balance:.6f} ETH")
        print(f"   Needed: {deployment_cost['cost_eth'] * 1.2:.6f} ETH")
        return
    
    # Compile contract
    print(f"\n📝 Compiling contract...")
    try:
        compiled = compile_contract(contract_file, params['contract_name'])
    except Exception as e:
        print(f"❌ Compilation failed: {e}")
        return
    
    bytecode = compiled['bytecode']
    abi = compiled['abi']
    
    # Prepare constructor arguments
    if params['template'] == 'advanced':
        # Advanced template has different constructor
        constructor_args = [params['constructor_args']['initialSupply']]
    else:
        # Standard templates
        args = params['constructor_args']
        constructor_args = [
            args['name'],
            args['symbol'],
            args['decimals'],
            args['initialSupply']
        ]
    
    # Deploy contract
    print(f"\n🚀 Deploying contract...")
    print(f"   Constructor args: {constructor_args}")
    
    # Confirm deployment
    if network in ['ethereum', 'polygon', 'arbitrum', 'bsc']:
        print(f"\n⚠️  MAINNET DEPLOYMENT on {network}")
        confirm = input("Deploy to mainnet? (yes/no): ")
        if confirm.lower() != 'yes':
            print("❌ Deployment cancelled")
            return
    
    try:
        contract_address, tx_hash = w3_manager.deploy_contract(
            bytecode=bytecode,
            abi=abi,
            constructor_args=constructor_args
        )
        
        print("\n" + "="*60)
        print("✅ DEPLOYMENT SUCCESSFUL")
        print("="*60)
        print(f"Token Address: {contract_address}")
        print(f"Transaction: {tx_hash}")
        print(f"Explorer: {w3_manager.get_explorer_url(contract_address, 'address')}")
        
        # Save deployment info
        deployment_info = {
            'token_params': params,
            'deployment': {
                'network': network,
                'address': contract_address,
                'tx_hash': tx_hash,
                'deployer': w3_manager.account.address,
                'timestamp': w3_manager.w3.eth.get_block('latest')['timestamp']
            },
            'abi': abi
        }
        
        # Save to deployments folder
        deployment_file = os.path.join(
            'contracts/deployments',
            f"{network}_{params['constructor_args']['symbol']}_deployment.json"
        )
        with open(deployment_file, 'w') as f:
            json.dump(deployment_info, f, indent=2)
        
        print(f"\n💾 Deployment info saved to: {deployment_file}")
        
        # Test the deployed token
        print(f"\n🧪 Testing deployed token...")
        contract = w3_manager.get_contract(contract_address, abi)
        
        # Basic checks
        if params['template'] != 'advanced':
            name = contract.functions.name().call()
            symbol = contract.functions.symbol().call()
            decimals = contract.functions.decimals().call()
            total_supply = contract.functions.totalSupply().call()
            deployer_balance = contract.functions.balanceOf(w3_manager.account.address).call()
            
            print(f"   Name: {name}")
            print(f"   Symbol: {symbol}")
            print(f"   Decimals: {decimals}")
            print(f"   Total Supply: {total_supply / (10**decimals):,.0f}")
            print(f"   Deployer Balance: {deployer_balance / (10**decimals):,.0f}")
        
        # Feature-specific tests
        if 'Mintable' in params['features']:
            print(f"   ✓ Minting enabled (owner only)")
        if 'Burnable' in params['features']:
            print(f"   ✓ Burning enabled")
        if 'Pausable' in params['features']:
            print(f"   ✓ Pause/unpause enabled (owner only)")
        
        print("\n🎉 Token deployed and verified!")
        
        # Verification reminder
        if verify and network != 'localhost':
            print(f"\n📋 To verify on block explorer:")
            print(f"   python scripts/compile/verify_contract.py \\")
            print(f"     --network {network} \\")
            print(f"     --address {contract_address} \\")
            print(f"     --contract {contract_file}")
        
        return contract_address
        
    except Exception as e:
        print(f"\n❌ Deployment failed: {e}")
        return None

if __name__ == '__main__':
    deploy_generated_token()