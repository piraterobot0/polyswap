// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PredictionMarketHookV2} from "../src/PredictionMarketHookV2.sol";

contract DeployV2 is Script {
    function run() public {
        // Load configuration from environment variables
        address poolManager = vm.envOr("POOLMANAGER", address(0x67366782805870060151383F4BbFF9daB53e5cD6));
        
        vm.startBroadcast();
        
        IPoolManager manager = IPoolManager(poolManager);
        
        // Deploy the improved hook
        PredictionMarketHookV2 hook = new PredictionMarketHookV2(manager);
        
        console.log("=================================");
        console.log("PredictionMarketHookV2 deployed!");
        console.log("=================================");
        console.log("Address:", address(hook));
        console.log("Pool Manager:", poolManager);
        console.log("");
        console.log("Features:");
        console.log("- Flexible liquidity amounts");
        console.log("- Configurable initial price");
        console.log("- SDK compatible");
        console.log("- Constant sum AMM (X+Y=K)");
        console.log("");
        console.log("Next steps:");
        console.log("1. Initialize pool with poolManager.initialize()");
        console.log("2. Set initial price with hook.setInitialPrice() (optional, defaults to 50/50)");
        console.log("3. Add liquidity with hook.addLiquidity() or hook.initializeLiquidity()");
        
        vm.stopBroadcast();
    }
}