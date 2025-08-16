// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PredictionMarketHookNoValidation} from "../src/PredictionMarketHookNoValidation.sol";

contract DeployNoValidation is Script {
    function run() public {
        // Load configuration from environment variables
        address poolManager = vm.envOr("POOLMANAGER", address(0x67366782805870060151383F4BbFF9daB53e5cD6));
        
        vm.startBroadcast();
        
        IPoolManager manager = IPoolManager(poolManager);
        
        // Deploy without validation
        PredictionMarketHookNoValidation hook = new PredictionMarketHookNoValidation(manager);
        
        console.log("PredictionMarketHook deployed at:", address(hook));
        console.log("WARNING: This hook bypasses address validation!");
        console.log("It may not work with Uniswap V4 if the address doesn't have proper flags");
        
        vm.stopBroadcast();
    }
}