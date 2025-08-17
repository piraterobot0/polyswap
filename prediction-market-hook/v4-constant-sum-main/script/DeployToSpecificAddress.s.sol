// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {FlexiblePredictionHook} from "../src/FlexiblePredictionHook.sol";
import {Create2} from "v4-core/src/libraries/Create2.sol";

contract DeployToSpecificAddress is Script {
    address constant TARGET_ADDRESS = 0x884F5C47fA1eCaF0C8957611f648Fb320551ab51;
    address constant POOL_MANAGER = 0x67366782805870060151383F4BbFF9daB53e5cD6;
    
    function run() external {
        console.log("Attempting to deploy FlexiblePredictionHook to:", TARGET_ADDRESS);
        console.log("Deployer address:", msg.sender);
        
        // Get the bytecode
        bytes memory bytecode = abi.encodePacked(
            type(FlexiblePredictionHook).creationCode,
            abi.encode(POOL_MANAGER)
        );
        
        // Try to find the salt that will deploy to the target address
        bytes32 salt;
        bool found = false;
        
        // We'll try a range of salts
        for (uint256 i = 0; i < 100000000; i++) {
            bytes32 testSalt = bytes32(i);
            address predictedAddress = Create2.computeAddress(
                testSalt,
                keccak256(bytecode),
                address(this)
            );
            
            if (predictedAddress == TARGET_ADDRESS) {
                salt = testSalt;
                found = true;
                console.log("Found salt:", uint256(salt));
                break;
            }
            
            // Check every 10000 iterations
            if (i % 10000 == 0) {
                console.log("Checked", i, "salts...");
            }
        }
        
        if (!found) {
            console.log("Could not find salt for target address");
            console.log("This might require a different deployer address or contract");
            revert("Salt not found");
        }
        
        vm.startBroadcast();
        
        // Deploy using CREATE2 with the found salt
        FlexiblePredictionHook hook = new FlexiblePredictionHook{salt: salt}(
            IPoolManager(POOL_MANAGER)
        );
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Successful ===");
        console.log("FlexiblePredictionHook deployed at:", address(hook));
        
        require(address(hook) == TARGET_ADDRESS, "Deployment address mismatch!");
    }
}