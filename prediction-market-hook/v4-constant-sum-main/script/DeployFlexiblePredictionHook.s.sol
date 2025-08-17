// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {FlexiblePredictionHook} from "../src/FlexiblePredictionHook.sol";
import {HookMiner} from "../test/utils/HookMiner.sol";

contract DeployFlexiblePredictionHook is Script {
    function run() external {
        // Load pool manager address from environment
        address poolManager = vm.envOr("POOLMANAGER", address(0x67366782805870060151383F4BbFF9daB53e5cD6));
        
        // Define the hook flags we need
        uint160 flags = uint160(
            Hooks.BEFORE_ADD_LIQUIDITY_FLAG | 
            Hooks.BEFORE_SWAP_FLAG | 
            Hooks.BEFORE_SWAP_RETURNS_DELTA_FLAG
        );
        
        // Find a valid salt for the hook address
        (address hookAddress, bytes32 salt) = HookMiner.find(
            address(this),
            flags,
            type(FlexiblePredictionHook).creationCode,
            abi.encode(poolManager)
        );
        
        console.log("Deploying FlexiblePredictionHook...");
        console.log("Target hook address:", hookAddress);
        console.log("Salt:", uint256(salt));
        
        vm.startBroadcast();
        
        // Deploy the hook using CREATE2
        FlexiblePredictionHook hook = new FlexiblePredictionHook{salt: salt}(IPoolManager(poolManager));
        
        require(address(hook) == hookAddress, "Hook address mismatch");
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Successful ===");
        console.log("FlexiblePredictionHook deployed at:", address(hook));
        console.log("Pool Manager:", poolManager);
        console.log("\nSave this address for future interactions!");
        
        // Write deployment info to file for easy reference
        string memory deploymentInfo = string(abi.encodePacked(
            "HOOK_ADDRESS=", vm.toString(address(hook)), "\n",
            "POOL_MANAGER=", vm.toString(poolManager), "\n",
            "DEPLOYMENT_BLOCK=", vm.toString(block.number), "\n"
        ));
        
        vm.writeFile(".deployment", deploymentInfo);
        console.log("\nDeployment info saved to .deployment file");
    }
}