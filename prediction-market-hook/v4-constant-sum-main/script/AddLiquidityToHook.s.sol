// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {PredictionMarketHook} from "../src/PredictionMarketHook.sol";
import {Constants} from "./base/Constants.sol";

contract AddLiquidityToHook is Script, Constants {
    // Update these with your actual token addresses
    address constant YES_TOKEN = address(0); // Add your YES token address
    address constant NO_TOKEN = address(0);  // Add your NO token address
    address constant HOOK_ADDRESS = address(0); // Add your deployed hook address
    
    function run() public {
        vm.startBroadcast();
        
        IPoolManager manager = IPoolManager(POOLMANAGER);
        PredictionMarketHook hook = PredictionMarketHook(HOOK_ADDRESS);
        
        // Setup currencies (ensure they're in the correct order)
        Currency yesToken = Currency.wrap(YES_TOKEN);
        Currency noToken = Currency.wrap(NO_TOKEN);
        
        (Currency currency0, Currency currency1) = yesToken < noToken ? 
            (yesToken, noToken) : (noToken, yesToken);
        
        // Create the pool key
        PoolKey memory key = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        // For 80/20 split with total of 2 tokens:
        // YES: 80% of 2 = 1.6 tokens
        // NO: 20% of 2 = 0.4 tokens
        uint256 TOTAL_LIQUIDITY = 2e18; // 2 tokens total
        
        // Approve tokens
        IERC20(YES_TOKEN).approve(address(hook), type(uint256).max);
        IERC20(NO_TOKEN).approve(address(hook), type(uint256).max);
        
        console.log("Adding liquidity to prediction market:");
        console.log("YES tokens: 1.6 (80%)");
        console.log("NO tokens: 0.4 (20%)");
        console.log("Total: 2 tokens");
        
        // Add liquidity
        hook.addInitialLiquidity(key, TOTAL_LIQUIDITY);
        
        console.log("Liquidity added successfully!");
        
        // Check the new prices
        (uint256 yesPrice, uint256 noPrice) = hook.getPrice(key);
        console.log("New YES price:", yesPrice * 100 / 1e18, "%");
        console.log("New NO price:", noPrice * 100 / 1e18, "%");
        
        vm.stopBroadcast();
    }
}