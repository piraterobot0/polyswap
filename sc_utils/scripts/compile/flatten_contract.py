#!/usr/bin/env python3
"""
Flatten Contract
Flatten Solidity contracts for verification on block explorers
"""

import sys
import os
import re
import click
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

def flatten_contract(contract_path: str, base_path: str = None) -> str:
    """
    Flatten a Solidity contract by inlining all imports
    
    Args:
        contract_path: Path to the main contract file
        base_path: Base path for resolving imports
    
    Returns:
        Flattened contract code
    """
    
    if base_path is None:
        base_path = os.path.dirname(contract_path)
    
    # Track processed files to avoid duplicates
    processed = set()
    
    # SPDX and pragma patterns
    spdx_pattern = re.compile(r'^\s*//\s*SPDX-License-Identifier:.*$', re.MULTILINE)
    pragma_pattern = re.compile(r'^\s*pragma\s+solidity\s+[^;]+;.*$', re.MULTILINE)
    import_pattern = re.compile(r'^\s*import\s+["\']([^"\']+)["\'];.*$', re.MULTILINE)
    
    # Collect all SPDX and pragma statements
    spdx_licenses = set()
    pragma_statements = set()
    
    def process_file(file_path: str, depth: int = 0) -> str:
        """Process a single file and its imports"""
        
        # Normalize path
        file_path = os.path.abspath(file_path)
        
        # Skip if already processed
        if file_path in processed:
            return ""
        
        processed.add(file_path)
        
        # Read file
        try:
            with open(file_path, 'r') as f:
                content = f.read()
        except FileNotFoundError:
            print(f"Warning: Could not find {file_path}")
            return ""
        
        # Extract SPDX license
        spdx_matches = spdx_pattern.findall(content)
        if spdx_matches:
            spdx_licenses.add(spdx_matches[0].strip())
        
        # Extract pragma statements
        pragma_matches = pragma_pattern.findall(content)
        if pragma_matches:
            pragma_statements.add(pragma_matches[0].strip())
        
        # Remove SPDX and pragma from content
        content = spdx_pattern.sub('', content)
        content = pragma_pattern.sub('', content)
        
        # Process imports
        result = []
        last_end = 0
        
        for match in import_pattern.finditer(content):
            # Add content before import
            result.append(content[last_end:match.start()])
            
            # Get import path
            import_path = match.group(1)
            
            # Resolve import path
            if import_path.startswith('./'):
                import_file = os.path.join(os.path.dirname(file_path), import_path)
            elif import_path.startswith('../'):
                import_file = os.path.abspath(os.path.join(os.path.dirname(file_path), import_path))
            else:
                # Check common locations
                possible_paths = [
                    os.path.join(base_path, import_path),
                    os.path.join(base_path, 'node_modules', import_path),
                    os.path.join(base_path, 'contracts', import_path),
                ]
                import_file = None
                for path in possible_paths:
                    if os.path.exists(path):
                        import_file = path
                        break
                
                if not import_file:
                    print(f"Warning: Could not resolve import {import_path}")
                    result.append(match.group(0))  # Keep original import
                    last_end = match.end()
                    continue
            
            # Process imported file
            imported_content = process_file(import_file, depth + 1)
            if imported_content:
                result.append(f"\n// Imported from: {import_path}\n")
                result.append(imported_content)
                result.append(f"\n// End of import: {import_path}\n")
            
            last_end = match.end()
        
        # Add remaining content
        result.append(content[last_end:])
        
        return ''.join(result).strip()
    
    # Process main contract
    main_content = process_file(contract_path)
    
    # Build final flattened contract
    flattened = []
    
    # Add single SPDX license (prefer MIT if multiple)
    if spdx_licenses:
        if any('MIT' in lic for lic in spdx_licenses):
            flattened.append("// SPDX-License-Identifier: MIT")
        else:
            flattened.append(list(spdx_licenses)[0])
    
    # Add highest pragma version
    if pragma_statements:
        # Sort pragma statements and use the highest version
        sorted_pragmas = sorted(pragma_statements)
        flattened.append(sorted_pragmas[-1])
    
    flattened.append("")
    flattened.append("// Flattened contract")
    flattened.append("")
    flattened.append(main_content)
    
    return '\n'.join(flattened)

@click.command()
@click.argument('contract_path', type=click.Path(exists=True))
@click.option('--output', '-o', help='Output file path')
@click.option('--print', '-p', is_flag=True, help='Print to stdout')
def flatten(contract_path, output, print):
    """Flatten a Solidity contract for verification"""
    
    print("\n" + "="*60)
    print("📄 CONTRACT FLATTENER")
    print("="*60)
    
    print(f"\n📋 Flattening: {contract_path}")
    
    # Flatten the contract
    try:
        flattened_code = flatten_contract(contract_path)
    except Exception as e:
        print(f"\n❌ Error flattening contract: {e}")
        return
    
    # Determine output path
    if not output:
        base_name = os.path.basename(contract_path).replace('.sol', '')
        output = os.path.join(
            os.path.dirname(contract_path),
            f"{base_name}_flattened.sol"
        )
    
    # Save flattened contract
    with open(output, 'w') as f:
        f.write(flattened_code)
    
    print(f"\n✅ Contract flattened successfully!")
    print(f"   Output: {output}")
    print(f"   Size: {len(flattened_code):,} characters")
    
    # Print if requested
    if print:
        print("\n" + "-"*60)
        print("FLATTENED CONTRACT:")
        print("-"*60)
        print(flattened_code)
        print("-"*60)
    
    # Verification tips
    print(f"\n💡 Verification Tips:")
    print(f"   1. Copy the flattened contract from: {output}")
    print(f"   2. Go to PolygonScan/Etherscan verification page")
    print(f"   3. Select 'Single File' verification")
    print(f"   4. Compiler: v0.8.19+commit.7dd6d404")
    print(f"   5. Optimization: Yes, 200 runs")
    print(f"   6. Paste the flattened contract code")

if __name__ == '__main__':
    flatten()