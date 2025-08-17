// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {PredictionMarketHook} from "../src/PredictionMarketHook.sol";

contract AddLiquidity_1Each is Script {
    using PoolIdLibrary for PoolKey;
    
    uint160 constant SQRT_PRICE_1_1 = 79228162514264337593543950336;
    function run() public {
        // Load configuration from environment variables
        address yesToken = vm.envOr("YES_TOKEN", address(0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1));
        address noToken = vm.envOr("NO_TOKEN", address(0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5));
        address poolManager = vm.envOr("POOLMANAGER", address(0x67366782805870060151383f4bbff9dab53e5cd6));
        address hookAddress = vm.envAddress("HOOK_ADDRESS"); // Required - must set in .env
        
        vm.startBroadcast();
        
        PredictionMarketHook hook = PredictionMarketHook(hookAddress);
        IPoolManager manager = IPoolManager(poolManager);
        
        // Setup currencies
        Currency yesTokenCurrency = Currency.wrap(yesToken);
        Currency noTokenCurrency = Currency.wrap(noToken);
        
        // Ensure correct ordering
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
        IERC20(yesToken).approve(address(hook), 1e18);
        IERC20(noToken).approve(address(hook), 1e18);
        
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