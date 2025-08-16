#!/usr/bin/env python3
"""
Export to Remix
Export contracts and deployment data for use in Remix IDE
"""

import sys
import os
import json
import click
import webbrowser
from pathlib import Path
from urllib.parse import quote

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

def create_remix_url(contract_code: str, name: str = None) -> str:
    """Create a Remix IDE URL with pre-loaded contract code"""
    
    # Remix base URL
    base_url = "https://remix.ethereum.org"
    
    # Encode the contract code
    encoded_code = quote(contract_code)
    
    # Create filename
    filename = f"{name}.sol" if name else "contract.sol"
    
    # Build the URL - Remix accepts code via URL parameters
    # Format: #code=<encoded_content>&optimize=true&runs=200&evmVersion=paris
    params = {
        'optimize': 'true',
        'runs': '200',
        'evmVersion': 'paris',  # For Solidity 0.8.19
        'autoCompile': 'true'
    }
    
    # Build query string
    query = "&".join([f"{k}={v}" for k, v in params.items()])
    
    # Note: Remix doesn't directly accept code via URL anymore for security
    # We'll provide instructions instead
    return base_url, filename, params

def generate_remix_instructions(contract_path: str, deployment_info: dict = None) -> str:
    """Generate instructions for using the contract in Remix"""
    
    instructions = f"""
🎨 REMIX IDE INSTRUCTIONS
========================

1. Open Remix IDE: https://remix.ethereum.org

2. Create New File:
   - Click "contracts" folder
   - Click "+" to create new file
   - Name it: {os.path.basename(contract_path)}

3. Copy Contract:
   - Copy the contract code from: {contract_path}
   - Paste into Remix editor

4. Compiler Settings:
   - Compiler Version: 0.8.19
   - Enable Optimization: ✓
   - Optimization Runs: 200
   - EVM Version: Paris

5. Compile:
   - Click "Solidity Compiler" tab
   - Click "Compile" button
"""

    if deployment_info:
        instructions += f"""
6. Interact with Deployed Contract:
   - Go to "Deploy & Run Transactions" tab
   - Environment: "Injected Provider - MetaMask"
   - At the bottom, paste contract address: {deployment_info.get('contract_address', 'N/A')}
   - Select contract from dropdown
   - Click "At Address" button

7. Verify on PolygonScan:
   - Click "Plugin Manager" (bottom icon)
   - Activate "Etherscan - Contract Verification"
   - Go to the plugin
   - Network: Polygon
   - Contract Address: {deployment_info.get('contract_address', 'N/A')}
   - Follow verification steps
"""
    
    return instructions

@click.command()
@click.argument('contract_path', type=click.Path(exists=True))
@click.option('--deployment', type=click.Path(exists=True), help='Deployment JSON file')
@click.option('--open-browser', is_flag=True, help='Open Remix in browser')
@click.option('--save-instructions', help='Save instructions to file')
def export_to_remix(contract_path, deployment, open_browser, save_instructions):
    """Export contract to Remix IDE with instructions"""
    
    print("\n" + "="*60)
    print("📤 EXPORT TO REMIX IDE")
    print("="*60)
    
    # Read contract
    with open(contract_path, 'r') as f:
        contract_code = f.read()
    
    # Load deployment info if provided
    deployment_info = None
    if deployment:
        with open(deployment, 'r') as f:
            deployment_info = json.load(f)
        print(f"\n📋 Using deployment: {deployment}")
    
    # Get contract name
    contract_name = os.path.basename(contract_path).replace('.sol', '')
    
    # Generate Remix URL and instructions
    remix_url, filename, params = create_remix_url(contract_code, contract_name)
    instructions = generate_remix_instructions(contract_path, deployment_info)
    
    print(instructions)
    
    # Save instructions if requested
    if save_instructions:
        with open(save_instructions, 'w') as f:
            f.write(instructions)
        print(f"\n💾 Instructions saved to: {save_instructions}")
    
    # Create a simple HTML file for easy copying
    html_file = contract_path.replace('.sol', '_remix.html')
    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <title>{contract_name} - Remix Export</title>
    <style>
        body {{ font-family: monospace; padding: 20px; }}
        pre {{ background: #f0f0f0; padding: 15px; overflow: auto; }}
        button {{ padding: 10px 20px; margin: 10px 0; cursor: pointer; }}
        .success {{ color: green; display: none; }}
    </style>
</head>
<body>
    <h1>{contract_name} - Remix Export</h1>
    
    <h2>Contract Code:</h2>
    <button onclick="copyContract()">📋 Copy Contract Code</button>
    <span class="success" id="copySuccess">✅ Copied to clipboard!</span>
    <pre id="contractCode">{contract_code}</pre>
    
    <h2>Instructions:</h2>
    <pre>{instructions}</pre>
    
    <h2>Quick Links:</h2>
    <p>
        <a href="{remix_url}" target="_blank">🎨 Open Remix IDE</a><br>
        {'<a href="https://polygonscan.com/address/' + deployment_info.get('contract_address', '') + '" target="_blank">🔍 View on PolygonScan</a>' if deployment_info else ''}
    </p>
    
    <script>
        function copyContract() {{
            const code = document.getElementById('contractCode').textContent;
            navigator.clipboard.writeText(code).then(() => {{
                document.getElementById('copySuccess').style.display = 'inline';
                setTimeout(() => {{
                    document.getElementById('copySuccess').style.display = 'none';
                }}, 2000);
            }});
        }}
    </script>
</body>
</html>"""
    
    with open(html_file, 'w') as f:
        f.write(html_content)
    
    print(f"\n🌐 HTML helper created: {html_file}")
    print("   Open this file in a browser for easy copying")
    
    if open_browser:
        print(f"\n🚀 Opening Remix IDE...")
        webbrowser.open(remix_url)
        print(f"🚀 Opening helper file...")
        webbrowser.open(f"file://{os.path.abspath(html_file)}")
    
    # Generate flattened contract if needed
    if deployment_info:
        print(f"\n💡 Tip: For verification, you might need a flattened contract")
        print(f"   Run: python scripts/compile/flatten_contract.py {contract_path}")

if __name__ == '__main__':
    export_to_remix()