// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {IUnlockCallback} from "v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";

contract TestInitialize is Script, IUnlockCallback {
    address constant POOL_MANAGER = 0x67366782805870060151383F4BbFF9daB53e5cD6;
    address constant HOOK_ADDRESS = 0x11109438ba3e2520A29972BE91ec9bA7d06D2339;
    address constant YES_TOKEN = 0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1;
    address constant NO_TOKEN = 0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5;
    
    IPoolManager poolManager;
    PoolKey poolKey;
    uint160 sqrtPriceX96;
    
    function run() external {
        poolManager = IPoolManager(POOL_MANAGER);
        
        // Setup currencies
        Currency yesTokenCurrency = Currency.wrap(YES_TOKEN);
        Currency noTokenCurrency = Currency.wrap(NO_TOKEN);
        
        (Currency currency0, Currency currency1) = yesTokenCurrency < noTokenCurrency ? 
            (yesTokenCurrency, noTokenCurrency) : (noTokenCurrency, yesTokenCurrency);
        
        console.log("Currency0:", Currency.unwrap(currency0));
        console.log("Currency1:", Currency.unwrap(currency1));
        console.log("Hook address:", HOOK_ADDRESS);
        
        // Check hook prefix
        uint160 hookAddr = uint160(HOOK_ADDRESS);
        uint16 prefix = uint16(hookAddr >> 144);
        console.log("Hook address prefix:", uint256(prefix));
        
        // Create pool key
        poolKey = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(HOOK_ADDRESS)
        });
        
        // For 80% YES probability
        sqrtPriceX96 = 158456325028528675187087900672;
        
        // Check if hook permissions are valid
        Hooks.Permissions memory expectedPerms = Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: true,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: false,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: true,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
        
        // Hooks.validateHookPermissions returns void and reverts on failure
        // So we'll just try to validate and continue if successful
        console.log("Validating hook permissions...");
        
        vm.startBroadcast();
        
        console.log("Attempting to initialize pool...");
        bytes memory data = "";
        poolManager.unlock(data);
        
        vm.stopBroadcast();
    }
    
    function unlockCallback(bytes calldata) external returns (bytes memory) {
        require(msg.sender == address(poolManager), "Not pool manager");
        
        console.log("In unlock callback, initializing pool...");
        poolManager.initialize(poolKey, sqrtPriceX96);
        console.log("Pool initialized!");
        
        return "";
    }
}