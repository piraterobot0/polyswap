"""
Web3 Connection Manager
Handles connections to various blockchain networks with hot wallet safety limits
"""

import os
import json
import time
from typing import Optional, Dict, Any
from web3 import Web3
from web3.middleware import geth_poa_middleware
from eth_account import Account
from dotenv import load_dotenv
from .safety_limits import HotWalletSafety
from .gas_manager import GasManager

# Load environment variables
load_dotenv()

class Web3Manager:
    """Manage Web3 connections and accounts"""
    
    def __init__(self, network: str = None, account_number: int = 1):
        """
        Initialize Web3Manager
        
        Args:
            network: Network name (default from env or 'sepolia')
            account_number: Which account to use (1 or 2, default 1)
        """
        self.safety = HotWalletSafety()
        self.safety.display_warnings()
        
        # Load network configurations
        with open('config/networks.json', 'r') as f:
            self.networks_config = json.load(f)
        
        # Load public RPC configurations
        with open('config/public_rpcs.json', 'r') as f:
            self.public_rpcs_config = json.load(f)
        
        # Set network
        self.network = network or os.getenv('DEFAULT_NETWORK', 'sepolia')
        if self.network not in self.networks_config['networks']:
            raise ValueError(f"Unknown network: {self.network}")
        
        # Initialize Web3 connection
        self.w3 = self._connect_web3()
        
        # Load account (hot wallet)
        self.account_number = account_number
        self.account = self._load_account(account_number)
        
        # Load both accounts for easy access
        self.accounts = {
            1: self._load_account(1),
            2: self._load_account(2)
        }
        
        # Initialize gas manager
        self.gas_manager = GasManager(self.w3, self.network)
        
        print(f"✅ Connected to {self.network}")
        print(f"📍 Active Account #{account_number}: {self.account.address}")
        print(f"💰 Balance: {self.get_balance()} ETH")
    
    def _connect_web3(self) -> Web3:
        """
        Connect to Web3 provider
        Tries private RPCs from .env first, then public RPCs as fallback
        
        Returns:
            Web3: Connected Web3 instance
        """
        network_info = self.networks_config['networks'][self.network]
        rpc_urls = []
        
        # First, try private RPC from environment
        if self.network != 'localhost':
            env_key = f"{self.network.upper()}_RPC"
            private_rpc = os.getenv(env_key)
            if private_rpc:
                rpc_urls.append(('private', private_rpc))
                print(f"🔐 Using private RPC from .env")
        
        # Add public RPCs as fallback
        if self.network in self.public_rpcs_config['rpcs']:
            public_rpcs = self.public_rpcs_config['rpcs'][self.network]
            for rpc in public_rpcs:
                rpc_urls.append(('public', rpc))
        
        # For localhost, use default
        if self.network == 'localhost':
            rpc_urls.append(('local', network_info.get('rpc', 'http://localhost:8545')))
        
        if not rpc_urls:
            raise ValueError(f"No RPC URLs available for {self.network}. Add {self.network.upper()}_RPC to .env or check public_rpcs.json")
        
        # Try each RPC until one works
        last_error = None
        for rpc_type, rpc_url in rpc_urls:
            try:
                # Connect to provider
                if rpc_url.startswith('ws'):
                    w3 = Web3(Web3.WebsocketProvider(rpc_url, websocket_timeout=10))
                else:
                    w3 = Web3(Web3.HTTPProvider(rpc_url, request_kwargs={'timeout': 10}))
                
                # Add POA middleware for certain networks
                if self.network in ['bsc', 'bsc_testnet', 'polygon', 'mumbai']:
                    w3.middleware_onion.inject(geth_poa_middleware, layer=0)
                
                # Verify connection
                if w3.is_connected():
                    if rpc_type == 'public':
                        print(f"📡 Connected via public RPC: {rpc_url[:30]}...")
                    return w3
                    
            except Exception as e:
                last_error = e
                if rpc_type == 'private':
                    print(f"⚠️  Private RPC failed, trying public RPCs...")
                continue
        
        # All RPCs failed
        raise ConnectionError(f"Failed to connect to {self.network}. Last error: {last_error}")
    
    def _load_account(self, account_number: int = 1) -> Account:
        """
        Load account from private key
        
        Args:
            account_number: Which account to load (1 or 2)
        
        Returns:
            Account: Loaded account
        """
        env_key = f'PRIVATE_KEY{account_number}'
        private_key = os.getenv(env_key)
        if not private_key:
            # Fallback to PRIVATE_KEY for backward compatibility
            if account_number == 1:
                private_key = os.getenv('PRIVATE_KEY')
            if not private_key:
                raise ValueError(f"Missing {env_key} in .env file")
        
        # Add 0x prefix if missing
        if not private_key.startswith('0x'):
            private_key = '0x' + private_key
        
        try:
            account = Account.from_key(private_key)
            return account
        except Exception as e:
            raise ValueError(f"Invalid private key for account {account_number}: {e}")
    
    def switch_account(self, account_number: int):
        """
        Switch to a different account
        
        Args:
            account_number: Account number to switch to (1 or 2)
        """
        if account_number not in [1, 2]:
            raise ValueError("Account number must be 1 or 2")
        
        self.account_number = account_number
        self.account = self.accounts[account_number]
        print(f"🔄 Switched to Account #{account_number}: {self.account.address}")
        print(f"💰 Balance: {self.get_balance()} ETH")
    
    def get_all_balances(self):
        """Get balances for all accounts"""
        for num, account in self.accounts.items():
            balance = self.get_balance(account.address)
            print(f"Account #{num}: {account.address}")
            print(f"  Balance: {balance:.6f} ETH")
    
    def get_balance(self, address: str = None, token_address: str = None) -> float:
        """
        Get balance of address
        
        Args:
            address: Address to check (default: loaded account)
            token_address: Token contract address (None for native token)
            
        Returns:
            float: Balance in ETH/tokens
        """
        address = address or self.account.address
        
        if token_address:
            # ERC20 token balance
            # This would need the ERC20 ABI
            raise NotImplementedError("Token balance check not yet implemented")
        else:
            # Native token balance
            balance_wei = self.w3.eth.get_balance(address)
            return float(self.w3.from_wei(balance_wei, 'ether'))
    
    def send_transaction(self, to: str, value_eth: float = 0, data: str = '0x', 
                         gas_limit: int = None, gas_price_gwei: float = None) -> str:
        """
        Send a transaction with safety checks
        
        Args:
            to: Recipient address
            value_eth: Value in ETH
            data: Transaction data
            gas_limit: Gas limit (auto-estimate if None)
            gas_price_gwei: Gas price in gwei (auto if None)
            
        Returns:
            str: Transaction hash
        """
        # Build transaction
        tx = {
            'from': self.account.address,
            'to': self.w3.to_checksum_address(to),
            'value': self.w3.to_wei(value_eth, 'ether'),
            'data': data,
            'nonce': self.w3.eth.get_transaction_count(self.account.address),
            'chainId': self.networks_config['networks'][self.network]['chainId']
        }
        
        # Handle gas
        if gas_price_gwei:
            tx['gasPrice'] = self.w3.to_wei(gas_price_gwei, 'gwei')
        else:
            tx['gasPrice'] = self.safety.get_safe_gas_price(self.w3.eth.gas_price)
        
        if gas_limit:
            tx['gas'] = gas_limit
        else:
            tx['gas'] = self.w3.eth.estimate_gas(tx)
        
        # Safety checks
        self.safety.check_transaction_limits(tx, self.network)
        
        # Sign and send
        signed_tx = self.account.sign_transaction(tx)
        # Handle different versions of web3py
        if hasattr(signed_tx, 'rawTransaction'):
            raw_tx = signed_tx.rawTransaction
        elif hasattr(signed_tx, 'raw_transaction'):
            raw_tx = signed_tx.raw_transaction
        else:
            raw_tx = signed_tx.raw
        
        tx_hash = self.w3.eth.send_raw_transaction(raw_tx)
        
        print(f"📤 Transaction sent: {tx_hash.hex()}")
        print(f"   Explorer: {self.get_explorer_url(tx_hash.hex(), 'tx')}")
        
        return tx_hash.hex()
    
    def wait_for_transaction(self, tx_hash: str, timeout: int = 120) -> Dict[str, Any]:
        """
        Wait for transaction confirmation
        
        Args:
            tx_hash: Transaction hash
            timeout: Timeout in seconds
            
        Returns:
            dict: Transaction receipt
        """
        print(f"⏳ Waiting for confirmation...")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                receipt = self.w3.eth.get_transaction_receipt(tx_hash)
                if receipt:
                    if receipt['status'] == 1:
                        print(f"✅ Transaction confirmed in block {receipt['blockNumber']}")
                    else:
                        print(f"❌ Transaction failed")
                    return receipt
            except Exception:
                pass
            time.sleep(2)
        
        raise TimeoutError(f"Transaction not confirmed after {timeout} seconds")
    
    def deploy_contract(self, bytecode: str, abi: list, constructor_args: list = None,
                       gas_limit: int = None, gas_price_gwei: float = None) -> tuple:
        """
        Deploy a smart contract
        
        Args:
            bytecode: Contract bytecode
            abi: Contract ABI
            constructor_args: Constructor arguments
            gas_limit: Gas limit
            gas_price_gwei: Gas price in gwei
            
        Returns:
            tuple: (contract_address, tx_hash)
        """
        # Create contract instance
        contract = self.w3.eth.contract(abi=abi, bytecode=bytecode)
        
        # Build constructor transaction
        if constructor_args:
            tx = contract.constructor(*constructor_args).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'chainId': self.networks_config['networks'][self.network]['chainId']
            })
        else:
            tx = contract.constructor().build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'chainId': self.networks_config['networks'][self.network]['chainId']
            })
        
        # Handle gas
        if gas_price_gwei:
            tx['gasPrice'] = self.w3.to_wei(gas_price_gwei, 'gwei')
        else:
            tx['gasPrice'] = self.safety.get_safe_gas_price(self.w3.eth.gas_price)
        
        if gas_limit:
            tx['gas'] = gas_limit
        else:
            tx['gas'] = int(self.w3.eth.estimate_gas(tx) * 1.2)  # Add 20% buffer
        
        # Check deployment limits
        deployment_cost = self.w3.from_wei(tx['gas'] * tx['gasPrice'], 'ether')
        self.safety.check_deployment_limits(self.network, deployment_cost)
        
        # Sign and send
        signed_tx = self.account.sign_transaction(tx)
        # Handle different versions of web3py
        if hasattr(signed_tx, 'rawTransaction'):
            raw_tx = signed_tx.rawTransaction
        elif hasattr(signed_tx, 'raw_transaction'):
            raw_tx = signed_tx.raw_transaction
        else:
            raw_tx = signed_tx.raw
        
        tx_hash = self.w3.eth.send_raw_transaction(raw_tx)
        
        print(f"📤 Deployment transaction sent: {tx_hash.hex()}")
        
        # Wait for confirmation
        receipt = self.wait_for_transaction(tx_hash.hex())
        
        if receipt['status'] == 1:
            contract_address = receipt['contractAddress']
            print(f"📝 Contract deployed at: {contract_address}")
            print(f"   Explorer: {self.get_explorer_url(contract_address, 'address')}")
            
            # Save deployment info
            self._save_deployment(contract_address, tx_hash.hex(), abi)
            
            return contract_address, tx_hash.hex()
        else:
            raise RuntimeError("Contract deployment failed")
    
    def get_contract(self, address: str, abi: list):
        """
        Get contract instance
        
        Args:
            address: Contract address
            abi: Contract ABI
            
        Returns:
            Contract: Web3 contract instance
        """
        return self.w3.eth.contract(
            address=self.w3.to_checksum_address(address),
            abi=abi
        )
    
    def call_function(self, contract_address: str, abi: list, function_name: str,
                     args: list = None, value_eth: float = 0) -> Any:
        """
        Call a contract function
        
        Args:
            contract_address: Contract address
            abi: Contract ABI
            function_name: Function name
            args: Function arguments
            value_eth: Value to send in ETH
            
        Returns:
            Any: Function result (for view functions) or tx_hash (for state-changing functions)
        """
        contract = self.get_contract(contract_address, abi)
        function = getattr(contract.functions, function_name)
        
        if args:
            function = function(*args)
        else:
            function = function()
        
        # Check if it's a view function
        try:
            # Try calling it (view function)
            result = function.call({'from': self.account.address})
            print(f"📖 {function_name} result: {result}")
            return result
        except Exception:
            # It's a state-changing function, need to send transaction
            tx = function.build_transaction({
                'from': self.account.address,
                'value': self.w3.to_wei(value_eth, 'ether'),
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'chainId': self.networks_config['networks'][self.network]['chainId'],
                'gasPrice': self.safety.get_safe_gas_price(self.w3.eth.gas_price)
            })
            
            # Estimate gas
            tx['gas'] = int(self.w3.eth.estimate_gas(tx) * 1.2)
            
            # Safety check
            self.safety.check_transaction_limits(tx, self.network)
            
            # Sign and send
            signed_tx = self.account.sign_transaction(tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            print(f"📤 Transaction sent: {tx_hash.hex()}")
            return tx_hash.hex()
    
    def get_explorer_url(self, identifier: str, type: str = 'tx') -> str:
        """
        Get block explorer URL
        
        Args:
            identifier: Transaction hash or address
            type: 'tx' or 'address'
            
        Returns:
            str: Explorer URL
        """
        explorer = self.networks_config['networks'][self.network].get('explorer')
        if not explorer:
            return "No explorer available"
        
        if type == 'tx':
            return f"{explorer}/tx/{identifier}"
        elif type == 'address':
            return f"{explorer}/address/{identifier}"
        else:
            return explorer
    
    def _save_deployment(self, address: str, tx_hash: str, abi: list):
        """Save deployment information"""
        import datetime
        
        deployment_info = {
            'address': address,
            'tx_hash': tx_hash,
            'network': self.network,
            'deployer': self.account.address,
            'timestamp': datetime.datetime.now().isoformat(),
            'abi': abi
        }
        
        filename = f"contracts/deployments/{self.network}_{address[:8]}.json"
        os.makedirs('contracts/deployments', exist_ok=True)
        
        with open(filename, 'w') as f:
            json.dump(deployment_info, f, indent=2)
        
        print(f"💾 Deployment saved to {filename}")