"""
Gas Manager Utility
Handles gas estimation, pricing, and transaction management for Web3 operations
"""

import time
from typing import Dict, Any, Optional, List, Tuple
from decimal import Decimal
from web3 import Web3
from web3.types import TxReceipt

class GasManager:
    """Manage gas for blockchain transactions"""
    
    def __init__(self, w3: Web3, network: str = 'polygon'):
        """
        Initialize Gas Manager
        
        Args:
            w3: Web3 instance
            network: Network name for specific gas strategies
        """
        self.w3 = w3
        self.network = network
        
        # Network-specific gas settings
        self.network_configs = {
            'ethereum': {
                'base_gas': 21000,
                'erc20_gas': 65000,
                'deploy_gas_multiplier': 1.3,
                'priority_fee': 2,  # gwei
                'max_gas_price': 500,  # gwei
            },
            'polygon': {
                'base_gas': 21000,
                'erc20_gas': 65000,
                'deploy_gas_multiplier': 1.2,
                'priority_fee': 30,  # gwei
                'max_gas_price': 500,  # gwei
            },
            'arbitrum': {
                'base_gas': 21000,
                'erc20_gas': 80000,
                'deploy_gas_multiplier': 1.2,
                'priority_fee': 0.1,  # gwei
                'max_gas_price': 10,  # gwei
            },
            'bsc': {
                'base_gas': 21000,
                'erc20_gas': 65000,
                'deploy_gas_multiplier': 1.2,
                'priority_fee': 1,  # gwei
                'max_gas_price': 50,  # gwei
            }
        }
        
        # Get network config or use polygon defaults
        self.config = self.network_configs.get(network, self.network_configs['polygon'])
    
    def estimate_gas(self, transaction: Dict[str, Any], buffer_percent: int = 20) -> int:
        """
        Estimate gas for a transaction with safety buffer
        
        Args:
            transaction: Transaction dictionary
            buffer_percent: Safety buffer percentage (default 20%)
            
        Returns:
            int: Estimated gas limit with buffer
        """
        try:
            # Try to estimate gas
            base_estimate = self.w3.eth.estimate_gas(transaction)
            
            # Add buffer
            with_buffer = int(base_estimate * (1 + buffer_percent / 100))
            
            # Ensure minimum gas based on transaction type
            if transaction.get('data', '0x') == '0x':
                # Simple transfer
                return max(with_buffer, self.config['base_gas'])
            else:
                # Contract interaction
                return max(with_buffer, self.config['erc20_gas'])
                
        except Exception as e:
            # Fallback to safe defaults
            if transaction.get('data', '0x') == '0x':
                return self.config['base_gas']
            else:
                return self.config['erc20_gas'] * 2
    
    def get_gas_price(self, priority: str = 'standard') -> Dict[str, int]:
        """
        Get current gas price with different priority levels
        
        Args:
            priority: 'slow', 'standard', 'fast', or 'instant'
            
        Returns:
            dict: Gas price configuration
        """
        current_gas_price = self.w3.eth.gas_price
        
        # Check if EIP-1559 is supported
        latest_block = self.w3.eth.get_block('latest')
        
        if 'baseFeePerGas' in latest_block:
            # EIP-1559 transaction
            base_fee = latest_block['baseFeePerGas']
            
            # Priority fee based on urgency
            priority_fees = {
                'slow': self.config['priority_fee'] * 0.8,
                'standard': self.config['priority_fee'],
                'fast': self.config['priority_fee'] * 1.5,
                'instant': self.config['priority_fee'] * 2
            }
            
            priority_fee = self.w3.to_wei(priority_fees.get(priority, priority_fees['standard']), 'gwei')
            
            # Max fee calculation
            max_fee = base_fee * 2 + priority_fee
            
            # Apply network limits
            max_allowed = self.w3.to_wei(self.config['max_gas_price'], 'gwei')
            max_fee = min(max_fee, max_allowed)
            
            return {
                'maxFeePerGas': max_fee,
                'maxPriorityFeePerGas': priority_fee,
                'type': '0x2'  # EIP-1559
            }
        else:
            # Legacy transaction
            multipliers = {
                'slow': 0.9,
                'standard': 1.0,
                'fast': 1.2,
                'instant': 1.5
            }
            
            gas_price = int(current_gas_price * multipliers.get(priority, 1.0))
            
            # Apply network limits
            max_allowed = self.w3.to_wei(self.config['max_gas_price'], 'gwei')
            gas_price = min(gas_price, max_allowed)
            
            return {
                'gasPrice': gas_price,
                'type': '0x0'  # Legacy
            }
    
    def build_transaction(self, from_address: str, to_address: str, value: float = 0,
                         data: str = '0x', gas_priority: str = 'standard',
                         nonce: Optional[int] = None) -> Dict[str, Any]:
        """
        Build a transaction with proper gas handling
        
        Args:
            from_address: Sender address
            to_address: Recipient address
            value: Value in ETH
            data: Transaction data
            gas_priority: Gas priority level
            nonce: Optional nonce (auto if None)
            
        Returns:
            dict: Complete transaction ready for signing
        """
        # Base transaction
        tx = {
            'from': self.w3.to_checksum_address(from_address),
            'to': self.w3.to_checksum_address(to_address),
            'value': self.w3.to_wei(value, 'ether'),
            'data': data,
            'chainId': self.w3.eth.chain_id
        }
        
        # Add nonce
        if nonce is None:
            tx['nonce'] = self.w3.eth.get_transaction_count(from_address)
        else:
            tx['nonce'] = nonce
        
        # Add gas price
        gas_config = self.get_gas_price(gas_priority)
        tx.update(gas_config)
        
        # Estimate gas
        tx['gas'] = self.estimate_gas(tx)
        
        return tx
    
    def calculate_transaction_cost(self, gas_limit: int, gas_price: Optional[int] = None) -> Dict[str, float]:
        """
        Calculate transaction cost in ETH and USD
        
        Args:
            gas_limit: Gas limit for transaction
            gas_price: Gas price in wei (current if None)
            
        Returns:
            dict: Cost breakdown
        """
        if gas_price is None:
            gas_price = self.get_gas_price()['gasPrice'] if 'gasPrice' in self.get_gas_price() else self.get_gas_price()['maxFeePerGas']
        
        # Calculate cost in wei and ETH
        cost_wei = gas_limit * gas_price
        cost_eth = float(self.w3.from_wei(cost_wei, 'ether'))
        
        # Estimate USD (rough)
        eth_price_estimates = {
            'ethereum': 3000,
            'polygon': 0.9,
            'arbitrum': 3000,
            'bsc': 300
        }
        
        eth_price = eth_price_estimates.get(self.network, 1)
        cost_usd = cost_eth * eth_price
        
        return {
            'gas_limit': gas_limit,
            'gas_price_gwei': float(self.w3.from_wei(gas_price, 'gwei')),
            'cost_eth': cost_eth,
            'cost_usd': cost_usd,
            'cost_wei': cost_wei
        }
    
    def wait_for_transaction_batch(self, tx_hashes: List[str], timeout: int = 300,
                                  poll_interval: int = 2) -> List[Tuple[str, Optional[TxReceipt]]]:
        """
        Wait for multiple transactions to confirm
        
        Args:
            tx_hashes: List of transaction hashes
            timeout: Maximum wait time in seconds
            poll_interval: Seconds between checks
            
        Returns:
            list: Tuples of (tx_hash, receipt or None)
        """
        start_time = time.time()
        pending = set(tx_hashes)
        receipts = {}
        
        print(f"⏳ Waiting for {len(tx_hashes)} transactions...")
        
        while pending and (time.time() - start_time) < timeout:
            confirmed_this_round = []
            
            for tx_hash in list(pending):
                try:
                    receipt = self.w3.eth.get_transaction_receipt(tx_hash)
                    if receipt:
                        receipts[tx_hash] = receipt
                        confirmed_this_round.append(tx_hash)
                        
                        status = "✅" if receipt['status'] == 1 else "❌"
                        print(f"   {status} {tx_hash[:16]}... (block {receipt['blockNumber']})")
                except:
                    pass
            
            # Remove confirmed transactions
            for tx_hash in confirmed_this_round:
                pending.remove(tx_hash)
            
            if pending:
                time.sleep(poll_interval)
        
        # Return results
        results = []
        for tx_hash in tx_hashes:
            results.append((tx_hash, receipts.get(tx_hash)))
        
        if pending:
            print(f"⚠️  {len(pending)} transactions still pending after {timeout}s")
        
        return results
    
    def optimize_gas_for_batch(self, num_transactions: int, value_per_tx: float,
                              balance: float) -> Dict[str, Any]:
        """
        Optimize gas settings for batch transactions
        
        Args:
            num_transactions: Number of transactions to send
            value_per_tx: Value per transaction in ETH
            balance: Available balance in ETH
            
        Returns:
            dict: Optimized settings
        """
        # Get current gas price
        gas_price_wei = self.get_gas_price()['gasPrice'] if 'gasPrice' in self.get_gas_price() else self.get_gas_price()['maxFeePerGas']
        gas_price_eth = float(self.w3.from_wei(gas_price_wei, 'ether'))
        
        # Calculate costs
        gas_per_tx = self.config['base_gas']
        gas_cost_per_tx = gas_per_tx * gas_price_eth
        total_cost_per_tx = value_per_tx + gas_cost_per_tx
        
        # Calculate maximum possible transactions
        max_possible = int(balance / total_cost_per_tx)
        recommended = min(num_transactions, max_possible)
        
        # Calculate totals
        total_value = recommended * value_per_tx
        total_gas_cost = recommended * gas_cost_per_tx
        total_cost = total_value + total_gas_cost
        
        return {
            'recommended_count': recommended,
            'max_possible': max_possible,
            'value_per_tx': value_per_tx,
            'gas_cost_per_tx': gas_cost_per_tx,
            'total_cost_per_tx': total_cost_per_tx,
            'total_value': total_value,
            'total_gas_cost': total_gas_cost,
            'total_cost': total_cost,
            'remaining_balance': balance - total_cost,
            'gas_price_gwei': float(self.w3.from_wei(gas_price_wei, 'gwei'))
        }
    
    def get_nonce_manager(self, address: str):
        """
        Get a nonce manager for sequential transactions
        
        Args:
            address: Address to manage nonces for
            
        Returns:
            NonceManager: Nonce manager instance
        """
        return NonceManager(self.w3, address)


class NonceManager:
    """Manage nonces for sequential transactions"""
    
    def __init__(self, w3: Web3, address: str):
        self.w3 = w3
        self.address = address
        self.current_nonce = None
        self.refresh()
    
    def refresh(self):
        """Refresh nonce from blockchain"""
        self.current_nonce = self.w3.eth.get_transaction_count(self.address)
        return self.current_nonce
    
    def get_nonce(self) -> int:
        """Get next nonce and increment"""
        if self.current_nonce is None:
            self.refresh()
        
        nonce = self.current_nonce
        self.current_nonce += 1
        return nonce
    
    def sync(self):
        """Sync with blockchain (use after errors)"""
        self.refresh()
        return self.current_nonce