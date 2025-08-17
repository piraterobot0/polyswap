// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {FlexiblePredictionHook} from "../src/FlexiblePredictionHook.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";

contract DeployFlexibleHookMined is Script {
    address constant POOL_MANAGER = 0x67366782805870060151383F4BbFF9daB53e5cD6;
    address constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
    
    // Compute CREATE2 address
    function computeAddress(bytes32 salt, bytes32 bytecodeHash, address deployer) internal pure returns (address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            deployer,
            salt,
            bytecodeHash
        )))));
    }
    
    function run() external {
        console.log("Mining for correct hook address...");
        console.log("Deployer:", msg.sender);
        
        // Define required flags
        uint160 flags = uint160(
            Hooks.BEFORE_ADD_LIQUIDITY_FLAG | 
            Hooks.BEFORE_SWAP_FLAG | 
            Hooks.BEFORE_SWAP_RETURNS_DELTA_FLAG
        );
        
        console.log("Required flags:", flags);
        
        // Get creation bytecode
        bytes memory creationCode = type(FlexiblePredictionHook).creationCode;
        bytes memory constructorArgs = abi.encode(POOL_MANAGER);
        bytes memory bytecode = abi.encodePacked(creationCode, constructorArgs);
        
        // Find a salt that produces an address with correct prefix
        bytes32 salt;
        address hookAddress;
        bool found = false;
        
        // Try different salts
        for (uint256 i = 0; i < 10000000; i++) {
            bytes32 testSalt = bytes32(i);
            address predictedAddress = computeAddress(
                testSalt,
                keccak256(bytecode),
                CREATE2_DEPLOYER
            );
            
            // Check if address has correct prefix
            uint160 prefix = uint160(predictedAddress) & 
                uint160(0xffFf000000000000000000000000000000000000);
            
            if (prefix == flags << 144) {
                salt = testSalt;
                hookAddress = predictedAddress;
                found = true;
                console.log("Found valid salt:", uint256(salt));
                console.log("Hook address will be:", hookAddress);
                break;
            }
            
            // Progress indicator
            if (i % 100000 == 0 && i > 0) {
                console.log("Checked", i, "salts...");
            }
        }
        
        if (!found) {
            // Try with less strict matching
            console.log("Trying less strict matching...");
            for (uint256 i = 0; i < 10000000; i++) {
                bytes32 testSalt = bytes32(i);
                address predictedAddress = computeAddress(
                    testSalt,
                    keccak256(bytecode),
                    msg.sender
                );
                
                // Check if the required bits are set (less strict)
                uint160 addr = uint160(predictedAddress);
                bool hasBeforeAddLiquidity = (addr & (uint160(1) << 159)) != 0;
                bool hasBeforeSwap = (addr & (uint160(1) << 153)) != 0; 
                bool hasBeforeSwapReturnsDelta = (addr & (uint160(1) << 145)) != 0;
                
                if (hasBeforeAddLiquidity && hasBeforeSwap && hasBeforeSwapReturnsDelta) {
                    salt = testSalt;
                    hookAddress = predictedAddress;
                    found = true;
                    console.log("Found valid salt (less strict):", uint256(salt));
                    console.log("Hook address will be:", hookAddress);
                    break;
                }
                
                if (i % 100000 == 0 && i > 0) {
                    console.log("Checked", i, "salts...");
                }
            }
        }
        
        require(found, "Could not find valid salt");
        
        vm.startBroadcast();
        
        // Deploy with the found salt
        FlexiblePredictionHook hook = new FlexiblePredictionHook{salt: salt}(
            IPoolManager(POOL_MANAGER)
        );
        
        require(address(hook) == hookAddress, "Deployed address mismatch");
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Successful ===");
        console.log("FlexiblePredictionHook deployed at:", address(hook));
        console.log("This address has the correct permission flags!");
        console.log("\nUpdate your .env with:");
        console.log(string(abi.encodePacked("FLEXIBLE_HOOK_MINED=", vm.toString(address(hook)))));
    }
}