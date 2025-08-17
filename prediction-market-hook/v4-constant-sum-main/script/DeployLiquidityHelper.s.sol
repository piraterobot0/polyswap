// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {LiquidityHelper} from "../src/LiquidityHelper.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";

contract DeployLiquidityHelper is Script {
    address constant POOL_MANAGER = 0x67366782805870060151383F4BbFF9daB53e5cD6;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        LiquidityHelper helper = new LiquidityHelper(IPoolManager(POOL_MANAGER));
        
        console.log("LiquidityHelper deployed at:", address(helper));
        
        vm.stopBroadcast();
    }
}