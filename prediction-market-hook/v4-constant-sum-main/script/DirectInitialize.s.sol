// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {IUnlockCallback} from "v4-core/src/interfaces/callback/IUnlockCallback.sol";

contract DirectInitialize is Script, IUnlockCallback {
    address constant POOL_MANAGER = 0x67366782805870060151383F4BbFF9daB53e5cD6;
    address constant HOOK_ADDRESS = 0x11109438ba3e2520A29972BE91ec9bA7d06D2339;
    address constant YES_TOKEN = 0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1;
    address constant NO_TOKEN = 0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5;
    
    IPoolManager poolManager;
    PoolKey poolKey;
    uint160 sqrtPriceX96 = 79228162514264337593543950336; // 1:1 ratio for testing
    
    function run() external {
        poolManager = IPoolManager(POOL_MANAGER);
        
        // Setup currencies
        Currency yesTokenCurrency = Currency.wrap(YES_TOKEN);
        Currency noTokenCurrency = Currency.wrap(NO_TOKEN);
        
        (Currency currency0, Currency currency1) = yesTokenCurrency < noTokenCurrency ? 
            (yesTokenCurrency, noTokenCurrency) : (noTokenCurrency, yesTokenCurrency);
        
        console.log("===== Direct Pool Initialization Test =====");
        console.log("Currency0:", Currency.unwrap(currency0));
        console.log("Currency1:", Currency.unwrap(currency1));
        console.log("Hook:", HOOK_ADDRESS);
        
        // Try with no hook first to isolate the issue
        console.log("\n1. Testing without hook (address(0))...");
        poolKey = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(0))
        });
        
        vm.startBroadcast();
        
        try poolManager.unlock("") {
            console.log("Unlock succeeded with no hook");
        } catch Error(string memory reason) {
            console.log("Failed with no hook:", reason);
        } catch {
            console.log("Failed with no hook (unknown error)");
        }
        
        // Now try with our hook
        console.log("\n2. Testing with our hook...");
        poolKey = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(HOOK_ADDRESS)
        });
        
        try poolManager.unlock("") {
            console.log("Unlock succeeded with hook!");
        } catch Error(string memory reason) {
            console.log("Failed with hook:", reason);
        } catch {
            console.log("Failed with hook (unknown error)");
        }
        
        vm.stopBroadcast();
    }
    
    function unlockCallback(bytes calldata) external returns (bytes memory) {
        require(msg.sender == address(poolManager), "Not pool manager");
        
        console.log("In unlock callback, attempting initialize...");
        
        try poolManager.initialize(poolKey, sqrtPriceX96) {
            console.log("Initialize succeeded!");
        } catch Error(string memory reason) {
            console.log("Initialize failed:", reason);
        } catch (bytes memory data) {
            console.log("Initialize failed with data:");
            console.logBytes(data);
        }
        
        return "";
    }
}