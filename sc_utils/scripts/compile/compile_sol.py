#!/usr/bin/env python3
"""
Solidity Compilation Utility
Compiles Solidity contracts using py-solc-x
"""

import json
import os
from pathlib import Path
from typing import Dict, Any
import solcx

def compile_contract(contract_path: str, contract_name: str = None) -> Dict[str, Any]:
    """
    Compile a Solidity contract
    
    Args:
        contract_path: Path to the Solidity file
        contract_name: Name of the contract to extract (if multiple in file)
        
    Returns:
        dict: Compiled contract with bytecode and ABI
    """
    # Read contract source
    with open(contract_path, 'r') as f:
        source_code = f.read()
    
    # Install solc if needed (version 0.8.19)
    solc_version = '0.8.19'
    if solc_version not in solcx.get_installed_solc_versions():
        print(f"Installing solc {solc_version}...")
        solcx.install_solc(solc_version)
    
    # Set solc version
    solcx.set_solc_version(solc_version)
    
    # Compile contract
    compiled = solcx.compile_source(
        source_code,
        output_values=['abi', 'bin', 'bin-runtime'],
        solc_version=solc_version
    )
    
    # Extract the contract
    if contract_name:
        # Find the contract by name
        contract_key = None
        for key in compiled.keys():
            if contract_name in key:
                contract_key = key
                break
        
        if not contract_key:
            raise ValueError(f"Contract {contract_name} not found in {contract_path}")
    else:
        # Use the first contract
        contract_key = list(compiled.keys())[0]
    
    contract = compiled[contract_key]
    
    # Prepare output
    result = {
        'abi': contract['abi'],
        'bytecode': contract['bin'],
        'bytecode_runtime': contract['bin-runtime'],
        'contract_name': contract_key.split(':')[-1]
    }
    
    # Save compiled contract
    output_dir = Path('contracts/compiled')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    output_file = output_dir / f"{result['contract_name']}.json"
    with open(output_file, 'w') as f:
        json.dump(result, f, indent=2)
    
    print(f"✅ Compiled {result['contract_name']}")
    print(f"   Bytecode size: {len(result['bytecode'])} chars")
    print(f"   ABI functions: {len([x for x in result['abi'] if x['type'] == 'function'])}")
    print(f"   Saved to: {output_file}")
    
    return result

def compile_directory(directory: str = 'contracts/source'):
    """
    Compile all Solidity files in a directory
    
    Args:
        directory: Directory containing Solidity files
    """
    sol_files = Path(directory).glob('**/*.sol')
    
    compiled_contracts = {}
    for sol_file in sol_files:
        print(f"\n📝 Compiling {sol_file}...")
        try:
            compiled = compile_contract(str(sol_file))
            compiled_contracts[compiled['contract_name']] = compiled
        except Exception as e:
            print(f"❌ Failed to compile {sol_file}: {e}")
    
    print(f"\n✅ Compiled {len(compiled_contracts)} contracts")
    return compiled_contracts

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1:
        # Compile specific file
        contract_path = sys.argv[1]
        contract_name = sys.argv[2] if len(sys.argv) > 2 else None
        compile_contract(contract_path, contract_name)
    else:
        # Compile all contracts in source directory
        compile_directory()