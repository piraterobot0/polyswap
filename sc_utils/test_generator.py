#!/usr/bin/env python3
"""
Test the ERC-20 Token Generator
"""

import subprocess
import sys

print("🧪 Testing ERC-20 Token Generator")
print("="*60)

# Test generating a basic token
print("\n1️⃣ Generating a basic token...")
result = subprocess.run([
    sys.executable, 
    "scripts/generate/generate_erc20.py",
    "--template", "basic",
    "--name", "Test Token",
    "--symbol", "TEST",
    "--decimals", "18",
    "--supply", "1000000"
], capture_output=True, text=True)

if result.returncode == 0:
    print("✅ Basic token generated successfully!")
    print(result.stdout)
else:
    print("❌ Failed to generate basic token")
    print(result.stderr)

# Test generating an advanced token
print("\n2️⃣ Generating an advanced token with cap...")
result = subprocess.run([
    sys.executable,
    "scripts/generate/generate_erc20.py", 
    "--template", "advanced",
    "--name", "Advanced DeFi Token",
    "--symbol", "ADT",
    "--decimals", "18", 
    "--supply", "1000000",
    "--cap", "5000000"
], capture_output=True, text=True)

if result.returncode == 0:
    print("✅ Advanced token generated successfully!")
    print(result.stdout)
else:
    print("❌ Failed to generate advanced token")
    print(result.stderr)

print("\n✅ Generator test complete!")
print("Check contracts/generated/ for the generated tokens")