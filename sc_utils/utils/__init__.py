"""
Web3 Utilities for Hot Wallet
⚠️ HOT WALLET MODE - Maximum $30 value
"""

from .web3_manager import Web3Manager
from .safety_limits import HotWalletSafety
from .gas_manager import GasManager, NonceManager

__all__ = ['Web3Manager', 'HotWalletSafety', 'GasManager', 'NonceManager']

# Display warning on import
print("⚠️  Loading HOT WALLET utilities - Maximum value: $30")