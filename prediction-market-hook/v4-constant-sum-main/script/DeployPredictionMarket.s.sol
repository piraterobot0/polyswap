// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {PredictionMarketHook} from "../src/PredictionMarketHook.sol";
import {Constants} from "./base/Constants.sol";

contract DeployPredictionMarket is Script, Constants {
    function run() public {
        // Load configuration from environment variables
        address yesToken = vm.envOr("YES_TOKEN", address(0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1));
        address noToken = vm.envOr("NO_TOKEN", address(0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5));
        address poolManager = vm.envOr("POOLMANAGER", address(0x67366782805870060151383f4bbff9dab53e5cd6));
        
        vm.startBroadcast();
        
        IPoolManager manager = IPoolManager(poolManager); // Using address from env
        
        address flags = address(
            uint160(Hooks.BEFORE_SWAP_FLAG | Hooks.BEFORE_SWAP_RETURNS_DELTA_FLAG | Hooks.BEFORE_ADD_LIQUIDITY_FLAG)
                ^ (0x4444 << 144)
        );
        
        bytes memory constructorArgs = abi.encode(manager);
        
        PredictionMarketHook hook = new PredictionMarketHook(manager);
        
        Currency yesTokenCurrency = Currency.wrap(yesToken);
        Currency noTokenCurrency = Currency.wrap(noToken);
        
        (Currency currency0, Currency currency1) = yesTokenCurrency < noTokenCurrency ? 
            (yesTokenCurrency, noTokenCurrency) : (noTokenCurrency, yesTokenCurrency);
        
        PoolKey memory key = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        manager.initialize(key, SQRT_PRICE_1_1);
        
        uint256 TOTAL_LIQUIDITY = 10000e18;
        
        IERC20(yesToken).approve(address(hook), type(uint256).max);
        IERC20(noToken).approve(address(hook), type(uint256).max);
        
        hook.addInitialLiquidity(key, TOTAL_LIQUIDITY);
        
        console.log("Prediction Market Hook deployed at:", address(hook));
        console.log("Pool initialized with 80% YES / 20% NO ratio");
        
        vm.stopBroadcast();
    }
}