// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {PredictionMarketHook} from "../src/PredictionMarketHook.sol";

contract AddLiquidity_1Each is Script {
    // Token addresses from Polygon mainnet
    address constant YES_TOKEN = 0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1; // wPOSI-YES
    address constant NO_TOKEN = 0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5;  // wPOSI-NO
    
    // Uniswap V4 on Polygon
    address constant POOL_MANAGER = 0x67366782805870060151383f4bbff9dab53e5cd6; // PoolManager on Polygon
    
    // TODO: Deploy and update this address
    address constant HOOK_ADDRESS = address(0); // Your deployed hook address (needs deployment first)
    
    function run() public {
        vm.startBroadcast();
        
        PredictionMarketHook hook = PredictionMarketHook(HOOK_ADDRESS);
        IPoolManager manager = IPoolManager(POOL_MANAGER);
        
        // Setup currencies
        Currency yesToken = Currency.wrap(YES_TOKEN);
        Currency noToken = Currency.wrap(NO_TOKEN);
        
        // Ensure correct ordering
        (Currency currency0, Currency currency1) = yesToken < noToken ? 
            (yesToken, noToken) : (noToken, yesToken);
        
        // Create pool key
        PoolKey memory key = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        // Check current liquidity status
        uint256 currentTotal = hook.totalLiquidity(key.toId());
        require(currentTotal == 0, "Liquidity already initialized");
        
        // You have 1 YES and 1 NO token (2 total)
        // The hook will create reserves of:
        // - YES reserve: 80% of 2 = 1.6 
        // - NO reserve: 20% of 2 = 0.4
        // Total in pool: 2 tokens (matching your input)
        
        uint256 totalAmount = 2e18; // 2 tokens total
        
        // Approve both tokens
        IERC20(YES_TOKEN).approve(address(hook), 1e18);
        IERC20(NO_TOKEN).approve(address(hook), 1e18);
        
        console.log("Adding liquidity:");
        console.log("Providing: 1 YES token + 1 NO token");
        console.log("This will create reserves with 80/20 price ratio");
        console.log("Initial YES price: 80%");
        console.log("Initial NO price: 20%");
        
        // Initialize the pool (if not already initialized)
        manager.initialize(key, SQRT_PRICE_1_1);
        
        // Add the liquidity
        hook.addInitialLiquidity(key, totalAmount);
        
        console.log("\nLiquidity added successfully!");
        console.log("Total liquidity in pool: 2 tokens");
        console.log("YES reserve: 1.6 tokens (80% price)");
        console.log("NO reserve: 0.4 tokens (20% price)");
        
        // Verify the prices
        (uint256 yesPrice, uint256 noPrice) = hook.getPrice(key);
        console.log("\nCurrent market prices:");
        console.log("YES:", (yesPrice * 100) / 1e18, "%");
        console.log("NO:", (noPrice * 100) / 1e18, "%");
        
        vm.stopBroadcast();
    }
}