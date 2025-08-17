#!/usr/bin/env python3
import hashlib
from eth_utils import keccak
import os

# Constants
CREATE2_DEPLOYER = bytes.fromhex("4e59b44847b379578588920cA78FbF26c0B4956C")
POOL_MANAGER = bytes.fromhex("67366782805870060151383F4BbFF9daB53e5cD6")

# Load bytecode (we'll get this from forge)
print("Getting bytecode from forge...")
import subprocess
result = subprocess.run([
    "forge", "inspect", 
    "src/FlexiblePredictionHook.sol:FlexiblePredictionHook", 
    "bytecode"
], capture_output=True, text=True, cwd="/home/codeandtest/proj/polyswap/prediction-market-hook/v4-constant-sum-main")

if result.returncode != 0:
    print("Error getting bytecode:", result.stderr)
    exit(1)

creation_code = bytes.fromhex(result.stdout.strip().replace("0x", ""))
constructor_args = POOL_MANAGER.rjust(32, b'\x00')
bytecode = creation_code + constructor_args

bytecode_hash = keccak(bytecode)

print(f"Bytecode hash: 0x{bytecode_hash.hex()}")
print("Mining for salt with prefix 0x1110...")

# Target prefix we need (0x1110 in upper 16 bits)
target_prefix = 0x1110

found = False
for i in range(10000000):
    salt = i.to_bytes(32, 'big')
    
    # Compute CREATE2 address
    preimage = b'\xff' + CREATE2_DEPLOYER + salt + bytecode_hash
    address = keccak(preimage)[12:]  # Take last 20 bytes
    
    # Check upper 16 bits
    address_int = int.from_bytes(address, 'big')
    prefix = (address_int >> 144) & 0xFFFF
    
    if prefix == target_prefix:
        print(f"\nFOUND!")
        print(f"Salt: {i}")
        print(f"Salt (hex): 0x{salt.hex()}")
        print(f"Address: 0x{address.hex()}")
        found = True
        
        # Save to file
        with open("/home/codeandtest/proj/polyswap/hook_salt.txt", "w") as f:
            f.write(f"SALT={i}\n")
            f.write(f"SALT_HEX=0x{salt.hex()}\n")
            f.write(f"ADDRESS=0x{address.hex()}\n")
        break
    
    if i % 100000 == 0 and i > 0:
        print(f"Checked {i} salts...")

if not found:
    print("Could not find valid salt")
else:
    print(f"\nSaved to hook_salt.txt")