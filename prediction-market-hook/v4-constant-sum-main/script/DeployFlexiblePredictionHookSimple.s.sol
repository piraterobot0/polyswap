// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {FlexiblePredictionHook} from "../src/FlexiblePredictionHook.sol";

contract DeployFlexiblePredictionHookSimple is Script {
    function run() external {
        // Load pool manager address from environment
        address poolManager = vm.envOr("POOLMANAGER", address(0x67366782805870060151383F4BbFF9daB53e5cD6));
        
        console.log("Deploying FlexiblePredictionHook...");
        console.log("Pool Manager:", poolManager);
        
        vm.startBroadcast();
        
        // Deploy the hook
        FlexiblePredictionHook hook = new FlexiblePredictionHook(IPoolManager(poolManager));
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Successful ===");
        console.log("FlexiblePredictionHook deployed at:", address(hook));
        console.log("Pool Manager:", poolManager);
        console.log("\nIMPORTANT: Save this hook address!");
        console.log("\nTo update your .env file, add:");
        console.log(string(abi.encodePacked("FLEXIBLE_HOOK_ADDRESS=", vm.toString(address(hook)))));
    }
}