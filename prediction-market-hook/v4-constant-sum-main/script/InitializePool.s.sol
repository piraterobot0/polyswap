// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {IUnlockCallback} from "v4-core/src/interfaces/callback/IUnlockCallback.sol";

contract InitializePool is Script, IUnlockCallback {
    using PoolIdLibrary for PoolKey;
    
    address constant POOL_MANAGER = 0x67366782805870060151383F4BbFF9daB53e5cD6;
    address constant HOOK_ADDRESS = 0x8202394e6f061C897f329074d2b4edDB0F116bAC;
    address constant YES_TOKEN = 0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1;
    address constant NO_TOKEN = 0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5;
    
    uint160 constant SQRT_PRICE_1_1 = 79228162514264337593543950336;
    
    IPoolManager poolManager;
    PoolKey poolKey;
    
    function run() external {
        poolManager = IPoolManager(POOL_MANAGER);
        
        // Setup currencies (ensure correct ordering)
        Currency yesTokenCurrency = Currency.wrap(YES_TOKEN);
        Currency noTokenCurrency = Currency.wrap(NO_TOKEN);
        
        (Currency currency0, Currency currency1) = yesTokenCurrency < noTokenCurrency ? 
            (yesTokenCurrency, noTokenCurrency) : (noTokenCurrency, yesTokenCurrency);
        
        // Create pool key
        poolKey = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(HOOK_ADDRESS)
        });
        
        console.log("Initializing pool...");
        console.log("Hook address:", HOOK_ADDRESS);
        // console.log("Pool ID info logged");
        
        vm.startBroadcast();
        
        // Try to initialize through unlock callback
        bytes memory result = poolManager.unlock(abi.encode(true));
        
        vm.stopBroadcast();
        
        console.log("Pool initialized!");
    }
    
    function unlockCallback(bytes calldata) external returns (bytes memory) {
        require(msg.sender == address(poolManager), "Not pool manager");
        
        // Initialize the pool
        poolManager.initialize(poolKey, SQRT_PRICE_1_1);
        
        return abi.encode(true);
    }
}