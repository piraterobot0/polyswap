// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {PredictionMarketHookSimple} from "../src/PredictionMarketHookSimple.sol";
import {HookMiner} from "../test/utils/HookMiner.sol";

contract MineAndDeploy is Script {
    function run() public {
        // Load configuration from environment variables
        address poolManager = vm.envOr("POOLMANAGER", address(0x67366782805870060151383F4BbFF9daB53e5cD6));
        
        vm.startBroadcast();
        
        IPoolManager manager = IPoolManager(poolManager);
        
        // Calculate the flags we need
        uint160 flags = uint160(
            Hooks.BEFORE_SWAP_FLAG | 
            Hooks.BEFORE_SWAP_RETURNS_DELTA_FLAG | 
            Hooks.BEFORE_ADD_LIQUIDITY_FLAG
        );
        
        console.log("Mining for hook address with flags:", flags);
        console.log("This may take a few minutes...");
        
        // Mine for a valid address
        bytes memory creationCode = type(PredictionMarketHookSimple).creationCode;
        bytes memory constructorArgs = abi.encode(manager);
        
        // Get the actual deployer address from environment variable
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(privateKey);
        console.log("Deployer address:", deployer);
        
        (address hookAddress, bytes32 salt) = HookMiner.find(
            deployer, // actual deployer address
            flags,
            creationCode,
            constructorArgs
        );
        
        console.log("Found valid hook address:", hookAddress);
        console.log("Salt:", uint256(salt));
        
        // Deploy to the mined address
        PredictionMarketHookSimple hook = new PredictionMarketHookSimple{salt: salt}(manager);
        
        require(address(hook) == hookAddress, "Hook deployed to wrong address");
        
        console.log("PredictionMarketHook deployed successfully at:", address(hook));
        
        vm.stopBroadcast();
    }
}