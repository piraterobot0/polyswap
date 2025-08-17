// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {FlexiblePredictionHook} from "../src/FlexiblePredictionHook.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";

contract MineAndDeploy is Script {
    address constant POOL_MANAGER = 0x67366782805870060151383F4BbFF9daB53e5cD6;
    address constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
    
    function run() external {
        console.log("Starting salt mining for Uniswap v4 hook...");
        
        // We need these specific flags set
        // BEFORE_ADD_LIQUIDITY_FLAG = 1 << 15 = 0x8000
        // BEFORE_SWAP_FLAG = 1 << 9 = 0x0200  
        // BEFORE_SWAP_RETURNS_DELTA_FLAG = 1 << 1 = 0x0002
        // Total = 0x8202 in the upper 16 bits
        
        uint160 targetPrefix = uint160(0x8202) << 144;
        console.log("Target prefix pattern:", uint256(targetPrefix));
        
        bytes memory bytecode = abi.encodePacked(
            type(FlexiblePredictionHook).creationCode,
            abi.encode(POOL_MANAGER)
        );
        
        bytes32 bytecodeHash = keccak256(bytecode);
        
        vm.startBroadcast();
        
        // Try salts starting from a random number to avoid collisions
        uint256 startSalt = uint256(keccak256(abi.encode(block.timestamp, msg.sender)));
        
        for (uint256 i = 0; i < 10000000; i++) {
            bytes32 salt = bytes32(startSalt + i);
            
            address predictedAddress = address(uint160(uint256(keccak256(abi.encodePacked(
                bytes1(0xff),
                CREATE2_DEPLOYER,
                salt,
                bytecodeHash
            )))));
            
            // Check if upper 16 bits match our required pattern
            uint160 addressPrefix = uint160(predictedAddress) >> 144;
            
            if (addressPrefix == 0x8202) {
                console.log("Found valid salt!");
                console.log("Salt:", uint256(salt));
                console.log("Predicted address:", predictedAddress);
                
                // Deploy using the CREATE2 deployer
                bytes memory deploymentData = abi.encodePacked(salt, bytecode);
                (bool success, bytes memory result) = CREATE2_DEPLOYER.call(deploymentData);
                require(success, "Deployment failed");
                
                address deployedAddress = address(uint160(bytes20(result)));
                require(deployedAddress == predictedAddress, "Address mismatch");
                
                console.log("\n=== SUCCESS ===");
                console.log("FlexiblePredictionHook deployed at:", deployedAddress);
                console.log("This address is valid for Uniswap v4!");
                console.log("\nAdd to .env:");
                console.log(string(abi.encodePacked("HOOK_V4_VALID=", vm.toString(deployedAddress))));
                
                vm.stopBroadcast();
                return;
            }
            
            if (i % 50000 == 0) {
                console.log("Checked", i, "salts...");
            }
        }
        
        vm.stopBroadcast();
        revert("Could not find valid salt in reasonable time");
    }
}