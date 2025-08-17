// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {FlexiblePredictionHook} from "../src/FlexiblePredictionHook.sol";

contract DeployWithSalt is Script {
    address constant POOL_MANAGER = 0x67366782805870060151383F4BbFF9daB53e5cD6;
    bytes32 constant SALT = bytes32(uint256(442)); // 0x1ba
    address constant EXPECTED_ADDRESS = 0x11109438ba3e2520A29972BE91ec9bA7d06D2339;
    
    function run() external {
        console.log("Deploying FlexiblePredictionHook with mined salt...");
        console.log("Salt:", uint256(SALT));
        console.log("Expected address:", EXPECTED_ADDRESS);
        
        vm.startBroadcast();
        
        // Deploy with CREATE2 using the mined salt
        FlexiblePredictionHook hook = new FlexiblePredictionHook{salt: SALT}(
            IPoolManager(POOL_MANAGER)
        );
        
        console.log("Deployed at:", address(hook));
        
        // Verify it deployed to the expected address
        require(address(hook) == EXPECTED_ADDRESS, "Address mismatch!");
        
        vm.stopBroadcast();
        
        console.log("\n=== SUCCESS ===");
        console.log("FlexiblePredictionHook deployed at:", address(hook));
        console.log("This address has the correct Uniswap v4 permission flags!");
        console.log("\nThe hook is ready to use with:");
        console.log("- BEFORE_ADD_LIQUIDITY");
        console.log("- BEFORE_SWAP");
        console.log("- BEFORE_SWAP_RETURNS_DELTA");
    }
}