// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {FlexiblePredictionHook} from "../src/FlexiblePredictionHook.sol";

contract DeployFlexibleHook is Script {
    function run() public {
        // Load configuration from environment
        address poolManager = vm.envOr("POOLMANAGER", address(0x67366782805870060151383F4BbFF9daB53e5cD6));
        
        vm.startBroadcast();
        
        IPoolManager manager = IPoolManager(poolManager);
        
        // Deploy the flexible hook
        FlexiblePredictionHook hook = new FlexiblePredictionHook(manager);
        
        console.log("====================================");
        console.log("FlexiblePredictionHook Deployed!");
        console.log("====================================");
        console.log("Address:", address(hook));
        console.log("Pool Manager:", poolManager);
        console.log("");
        console.log("Features:");
        console.log("- Accepts ANY amount of liquidity");
        console.log("- Works with minimal token amounts");
        console.log("- Constant sum AMM (X+Y=K)");
        console.log("- SDK compatible");
        console.log("");
        console.log("Next steps:");
        console.log("1. Initialize pool with poolManager.initialize()");
        console.log("2. Add liquidity with hook.addLiquidity() or hook.addAvailableLiquidity()");
        console.log("3. Start swapping!");
        
        vm.stopBroadcast();
    }
}