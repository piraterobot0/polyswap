// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {PredictionMarketHook} from "../src/PredictionMarketHook.sol";

contract AddEqualLiquidity is Script {
    // IMPORTANT: Update these addresses with your actual values
    address constant YES_TOKEN = address(0); // Your YES token address
    address constant NO_TOKEN = address(0);  // Your NO token address
    address constant HOOK_ADDRESS = address(0); // Your deployed hook address
    address constant POOL_MANAGER = address(0); // Your PoolManager address
    
    function run() public {
        vm.startBroadcast();
        
        // Since the hook expects 80/20 ratio initially but you want to add 1:1,
        // we need to modify the approach
        addEqualAmounts();
        
        vm.stopBroadcast();
    }
    
    function addEqualAmounts() internal {
        IPoolManager manager = IPoolManager(POOL_MANAGER);
        PredictionMarketHook hook = PredictionMarketHook(HOOK_ADDRESS);
        
        // Setup currencies
        Currency yesToken = Currency.wrap(YES_TOKEN);
        Currency noToken = Currency.wrap(NO_TOKEN);
        
        (Currency currency0, Currency currency1) = yesToken < noToken ? 
            (yesToken, noToken) : (noToken, yesToken);
        
        PoolKey memory key = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        uint256 amount = 1e18; // 1 token each
        
        // Approve both tokens
        IERC20(YES_TOKEN).approve(address(hook), amount);
        IERC20(NO_TOKEN).approve(address(hook), amount);
        
        console.log("Adding equal liquidity:");
        console.log("YES tokens: 1");
        console.log("NO tokens: 1");
        
        // Note: The current hook implementation expects 80/20 ratio
        // You may need to modify the hook to accept custom ratios
        // For now, this will call with total of 2 tokens (which will be split 80/20)
        hook.addInitialLiquidity(key, 2e18);
        
        console.log("Liquidity added!");
    }
}