// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {FlexiblePredictionHook} from "../src/FlexiblePredictionHook.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

contract AddLiquidityFlexible is Script {
    using PoolIdLibrary for PoolKey;
    
    // Contract addresses
    address constant POOL_MANAGER = 0x67366782805870060151383F4BbFF9daB53e5cD6;
    address constant HOOK_ADDRESS = 0x8202394e6f061C897f329074d2b4edDB0F116bAC;
    address constant YES_TOKEN = 0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1;
    address constant NO_TOKEN = 0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5;
    
    uint160 constant SQRT_PRICE_1_1 = 79228162514264337593543950336;
    
    function run() external {
        console.log("Adding liquidity to FlexiblePredictionHook");
        console.log("Hook address:", HOOK_ADDRESS);
        console.log("Sender:", msg.sender);
        
        FlexiblePredictionHook hook = FlexiblePredictionHook(HOOK_ADDRESS);
        IPoolManager manager = IPoolManager(POOL_MANAGER);
        
        // Setup currencies (ensure correct ordering)
        Currency yesTokenCurrency = Currency.wrap(YES_TOKEN);
        Currency noTokenCurrency = Currency.wrap(NO_TOKEN);
        
        (Currency currency0, Currency currency1) = yesTokenCurrency < noTokenCurrency ? 
            (yesTokenCurrency, noTokenCurrency) : (noTokenCurrency, yesTokenCurrency);
        
        // Create pool key
        PoolKey memory key = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        // Check current balances
        uint256 yesBalance = IERC20(YES_TOKEN).balanceOf(msg.sender);
        uint256 noBalance = IERC20(NO_TOKEN).balanceOf(msg.sender);
        
        console.log("Current YES balance:", yesBalance);
        console.log("Current NO balance:", noBalance);
        
        // Since we have very small amounts, we'll use all available tokens
        // The hook will handle the 80/20 ratio internally based on initial settings
        
        // Check if pool needs initialization
        uint256 currentLiquidity = hook.totalLiquidity(key.toId());
        console.log("Current pool liquidity:", currentLiquidity);
        
        vm.startBroadcast();
        
        if (currentLiquidity == 0) {
            console.log("Pool is empty, setting initial ratio to 80% YES");
            // Set initial ratio: 80% YES probability
            hook.setInitialRatio(key, 80);
            
            // Initialize pool if needed
            try manager.initialize(key, SQRT_PRICE_1_1) {
                console.log("Pool initialized");
            } catch {
                console.log("Pool already initialized");
            }
        }
        
        // Approve tokens to the hook
        IERC20(YES_TOKEN).approve(address(hook), yesBalance);
        IERC20(NO_TOKEN).approve(address(hook), noBalance);
        
        console.log("\nAdding liquidity:");
        console.log("YES tokens:", yesBalance);
        console.log("NO tokens:", noBalance);
        
        // Add liquidity using all available tokens
        uint256 shares = hook.addLiquidity(key, yesBalance, noBalance);
        
        console.log("\nLiquidity added successfully!");
        console.log("LP shares received:", shares);
        
        // Get pool info after adding liquidity
        (uint256 totalLiq, uint256 reserve0, uint256 reserve1, uint256 price0, uint256 price1) = hook.getPoolInfo(key);
        
        console.log("\nPool state after liquidity:");
        console.log("Total liquidity:", totalLiq);
        console.log("Reserve0:", reserve0);
        console.log("Reserve1:", reserve1);
        console.log("Price0 (%):", price0);
        console.log("Price1 (%):", price1);
        
        // Show which token is YES and which is NO
        if (Currency.unwrap(currency0) == YES_TOKEN) {
            console.log("\nYES token price:", price0, "%");
            console.log("NO token price:", price1, "%");
        } else {
            console.log("\nYES token price:", price1, "%");
            console.log("NO token price:", price0, "%");
        }
        
        vm.stopBroadcast();
    }
}