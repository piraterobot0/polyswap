// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PredictionMarketHookSimple} from "../src/PredictionMarketHookSimple.sol";

contract DeploySimple is Script {
    address constant POOLMANAGER = 0x67366782805870060151383F4BbFF9daB53e5cD6; // Polygon V4 PoolManager
    
    function run() public {
        vm.startBroadcast();
        
        IPoolManager manager = IPoolManager(POOLMANAGER);
        
        // Deploy the hook
        PredictionMarketHookSimple hook = new PredictionMarketHookSimple(manager);
        
        console.log("PredictionMarketHookSimple deployed at:", address(hook));
        
        vm.stopBroadcast();
    }
}