"""
Hot Wallet Safety Limits
⚠️ This module enforces safety limits for the hot wallet implementation
Maximum value: $30 USD
"""

import os
from decimal import Decimal
from typing import Dict, Any
from web3 import Web3

# Create a Web3 instance for utility functions
w3_utils = Web3()

class HotWalletSafety:
    """Safety limits for hot wallet operations"""
    
    def __init__(self):
        # Load limits from environment or use defaults
        self.MAX_TRANSACTION_VALUE_ETH = Decimal(os.getenv('MAX_TRANSACTION_VALUE_ETH', '0.01'))
        self.MAX_GAS_PRICE_GWEI = int(os.getenv('MAX_GAS_PRICE_GWEI', '100'))
        self.DAILY_SPENDING_LIMIT_USD = Decimal(os.getenv('DAILY_SPENDING_LIMIT_USD', '30'))
        self.REQUIRE_CONFIRMATION_MAINNET = os.getenv('REQUIRE_CONFIRMATION_MAINNET', 'true').lower() == 'true'
        self.REQUIRE_CONFIRMATION_VALUE_OVER = Decimal(os.getenv('REQUIRE_CONFIRMATION_VALUE_OVER', '0.005'))
        
        # Track daily spending
        self.daily_spent_usd = Decimal('0')
        
        print("🔥 HOT WALLET MODE - Maximum value: $30")
        print(f"⚠️  Max transaction: {self.MAX_TRANSACTION_VALUE_ETH} ETH")
        print(f"⚠️  Max gas price: {self.MAX_GAS_PRICE_GWEI} gwei")
        print(f"⚠️  Daily limit: ${self.DAILY_SPENDING_LIMIT_USD}")
    
    def check_transaction_limits(self, tx_dict: Dict[str, Any], network: str = "sepolia") -> bool:
        """
        Check if transaction is within hot wallet safety limits
        
        Args:
            tx_dict: Transaction dictionary
            network: Network name
            
        Returns:
            bool: True if within limits
            
        Raises:
            ValueError: If limits exceeded
        """
        errors = []
        
        # Check value limit
        value_eth = w3_utils.from_wei(tx_dict.get('value', 0), 'ether')
        if value_eth > self.MAX_TRANSACTION_VALUE_ETH:
            errors.append(f"Transaction value {value_eth} ETH exceeds hot wallet limit of {self.MAX_TRANSACTION_VALUE_ETH} ETH")
        
        # Check gas price limit
        gas_price_gwei = w3_utils.from_wei(tx_dict.get('gasPrice', 0), 'gwei')
        if gas_price_gwei > self.MAX_GAS_PRICE_GWEI:
            errors.append(f"Gas price {gas_price_gwei} gwei exceeds limit of {self.MAX_GAS_PRICE_GWEI} gwei")
        
        # Check daily spending limit (rough estimate)
        estimated_usd = float(value_eth) * 3000  # Rough ETH price
        if self.daily_spent_usd + Decimal(str(estimated_usd)) > self.DAILY_SPENDING_LIMIT_USD:
            errors.append(f"Transaction would exceed daily spending limit of ${self.DAILY_SPENDING_LIMIT_USD}")
        
        # Require confirmation for mainnet
        if network in ['ethereum', 'polygon', 'arbitrum', 'bsc'] and self.REQUIRE_CONFIRMATION_MAINNET:
            print(f"\n⚠️  MAINNET TRANSACTION on {network}")
            print(f"   To: {tx_dict.get('to', 'Contract Creation')}")
            print(f"   Value: {value_eth} ETH")
            print(f"   Gas Price: {gas_price_gwei} gwei")
            
            confirm = input("\n🔴 Confirm mainnet transaction? (yes/no): ")
            if confirm.lower() != 'yes':
                errors.append("Mainnet transaction cancelled by user")
        
        # Require confirmation for high value
        elif value_eth > self.REQUIRE_CONFIRMATION_VALUE_OVER:
            print(f"\n⚠️  High value transaction: {value_eth} ETH")
            confirm = input("Confirm transaction? (yes/no): ")
            if confirm.lower() != 'yes':
                errors.append("Transaction cancelled by user")
        
        if errors:
            print("\n🔴 TRANSACTION BLOCKED - Safety limits exceeded:")
            for error in errors:
                print(f"   - {error}")
            raise ValueError("\n".join(errors))
        
        # Update daily spending
        self.daily_spent_usd += Decimal(str(estimated_usd))
        
        return True
    
    def check_deployment_limits(self, network: str, estimated_cost_eth: Decimal) -> bool:
        """
        Check if contract deployment is within limits
        
        Args:
            network: Network name
            estimated_cost_eth: Estimated deployment cost in ETH
            
        Returns:
            bool: True if within limits
        """
        if estimated_cost_eth > self.MAX_TRANSACTION_VALUE_ETH:
            raise ValueError(f"Deployment cost {estimated_cost_eth} ETH exceeds hot wallet limit of {self.MAX_TRANSACTION_VALUE_ETH} ETH")
        
        if network in ['ethereum', 'polygon', 'arbitrum', 'bsc']:
            print(f"\n⚠️  MAINNET DEPLOYMENT on {network}")
            print(f"   Estimated cost: {estimated_cost_eth} ETH")
            print("   ⚠️  Remember: This is a HOT WALLET - use testnets for development")
            
            confirm = input("\n🔴 Deploy to mainnet? (yes/no): ")
            if confirm.lower() != 'yes':
                raise ValueError("Mainnet deployment cancelled by user")
        
        return True
    
    def get_safe_gas_price(self, suggested_gas_price: int) -> int:
        """
        Get gas price within safety limits
        
        Args:
            suggested_gas_price: Suggested gas price in wei
            
        Returns:
            int: Safe gas price in wei
        """
        max_gas_wei = w3_utils.to_wei(self.MAX_GAS_PRICE_GWEI, 'gwei')
        if suggested_gas_price > max_gas_wei:
            print(f"⚠️  Gas price capped at {self.MAX_GAS_PRICE_GWEI} gwei (hot wallet limit)")
            return max_gas_wei
        return suggested_gas_price
    
    def display_warnings(self):
        """Display hot wallet warnings"""
        print("\n" + "="*50)
        print("🔥 HOT WALLET WARNINGS 🔥")
        print("="*50)
        print("• Maximum value: $30 USD")
        print("• Security: Basic (not production-ready)")
        print("• Use case: Testing and learning only")
        print("• Network: Use testnets when possible")
        print("• Never store large amounts")
        print("="*50 + "\n")