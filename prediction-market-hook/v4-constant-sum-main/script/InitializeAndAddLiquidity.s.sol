// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {LiquidityHelper} from "../src/LiquidityHelper.sol";
import {FlexiblePredictionHook} from "../src/FlexiblePredictionHook.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {PoolIdLibrary} from "v4-core/src/types/PoolId.sol";

contract InitializeAndAddLiquidity is Script {
    using PoolIdLibrary for PoolKey;
    
    address constant POOL_MANAGER = 0x67366782805870060151383F4BbFF9daB53e5cD6;
    address constant HOOK_ADDRESS = 0x11109438ba3e2520A29972BE91ec9bA7d06D2339;
    address constant YES_TOKEN = 0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1;
    address constant NO_TOKEN = 0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5;
    address constant LIQUIDITY_HELPER = 0x04B2f36a19d15382a14D718c4D640Bdd2a2DD873;
    
    // For 80% YES probability, we need sqrt(0.8/0.2) = sqrt(4) = 2
    // In Q64.96 format: 2 * 2^96 = 158456325028528675187087900672
    uint160 constant SQRT_PRICE_80_20 = 158456325028528675187087900672;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Setup currencies (ensure correct ordering)
        Currency yesTokenCurrency = Currency.wrap(YES_TOKEN);
        Currency noTokenCurrency = Currency.wrap(NO_TOKEN);
        
        (Currency currency0, Currency currency1) = yesTokenCurrency < noTokenCurrency ? 
            (yesTokenCurrency, noTokenCurrency) : (noTokenCurrency, yesTokenCurrency);
        
        console.log("Currency0:", Currency.unwrap(currency0));
        console.log("Currency1:", Currency.unwrap(currency1));
        
        // Create pool key
        PoolKey memory poolKey = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(HOOK_ADDRESS)
        });
        
        // Step 1: Initialize pool through LiquidityHelper
        console.log("Initializing pool with 80% YES probability...");
        LiquidityHelper helper = LiquidityHelper(LIQUIDITY_HELPER);
        
        try helper.initializePool(
            currency0,
            currency1,
            3000,
            60,
            IHooks(HOOK_ADDRESS),
            SQRT_PRICE_80_20
        ) {
            console.log("Pool initialized successfully!");
        } catch Error(string memory reason) {
            console.log("Pool initialization failed:", reason);
            // Pool might already be initialized, continue
        } catch {
            console.log("Pool initialization failed with unknown error");
            // Continue anyway
        }
        
        // Step 2: Check token balances
        uint256 yesBalance = IERC20(YES_TOKEN).balanceOf(deployer);
        uint256 noBalance = IERC20(NO_TOKEN).balanceOf(deployer);
        
        console.log("YES token balance:", yesBalance);
        console.log("NO token balance:", noBalance);
        
        // Step 3: Approve hook to spend tokens
        console.log("Approving tokens...");
        IERC20(YES_TOKEN).approve(HOOK_ADDRESS, yesBalance);
        IERC20(NO_TOKEN).approve(HOOK_ADDRESS, noBalance);
        
        // Also approve pool manager in case needed
        IERC20(YES_TOKEN).approve(POOL_MANAGER, yesBalance);
        IERC20(NO_TOKEN).approve(POOL_MANAGER, noBalance);
        
        // Step 4: Add liquidity with 80% YES probability
        // For constant sum AMM with 80% YES probability:
        // We want reserve0/total = 0.8 and reserve1/total = 0.2
        // With our balances: YES=3,000,000 wei ($3), NO=2,000,001 wei ($2)
        
        FlexiblePredictionHook hook = FlexiblePredictionHook(HOOK_ADDRESS);
        
        // Set initial ratio before adding liquidity
        console.log("Setting initial ratio to 80% YES...");
        try hook.setInitialRatio(poolKey, 80) {
            console.log("Initial ratio set!");
        } catch {
            console.log("Could not set initial ratio (pool may already have liquidity)");
        }
        
        // Determine which token is currency0
        uint256 amount0;
        uint256 amount1;
        if (Currency.unwrap(currency0) == YES_TOKEN) {
            amount0 = yesBalance; // YES is currency0
            amount1 = noBalance;  // NO is currency1
        } else {
            amount0 = noBalance;  // NO is currency0
            amount1 = yesBalance; // YES is currency1
        }
        
        console.log("Adding liquidity...");
        console.log("Amount0:", amount0);
        console.log("Amount1:", amount1);
        
        try hook.addLiquidity(poolKey, amount0, amount1) returns (uint256 shares) {
            console.log("Liquidity added successfully!");
            console.log("LP shares received:", shares);
            
            // Check pool state
            (uint256 r0, uint256 r1) = hook.getReserves(poolKey);
            console.log("Reserve0:", r0);
            console.log("Reserve1:", r1);
            
            (uint256 price0, uint256 price1) = hook.getPrices(poolKey);
            console.log("Price0:", price0, "%");
            console.log("Price1:", price1, "%");
        } catch Error(string memory reason) {
            console.log("Failed to add liquidity:", reason);
        } catch {
            console.log("Failed to add liquidity with unknown error");
        }
        
        vm.stopBroadcast();
    }
}