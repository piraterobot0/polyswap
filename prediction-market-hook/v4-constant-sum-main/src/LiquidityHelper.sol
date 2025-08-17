// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {StateLibrary} from "v4-core/src/libraries/StateLibrary.sol";

contract LiquidityHelper is IUnlockCallback {
    using PoolIdLibrary for PoolKey;
    using StateLibrary for IPoolManager;
    
    IPoolManager public immutable poolManager;
    
    struct CallbackData {
        PoolKey key;
        uint160 sqrtPriceX96;
        address sender;
    }
    
    constructor(IPoolManager _poolManager) {
        poolManager = _poolManager;
    }
    
    function initializePool(
        Currency currency0,
        Currency currency1,
        uint24 fee,
        int24 tickSpacing,
        IHooks hooks,
        uint160 sqrtPriceX96
    ) external {
        PoolKey memory key = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: fee,
            tickSpacing: tickSpacing,
            hooks: hooks
        });
        
        bytes memory data = abi.encode(CallbackData({
            key: key,
            sqrtPriceX96: sqrtPriceX96,
            sender: msg.sender
        }));
        
        poolManager.unlock(data);
    }
    
    function unlockCallback(bytes calldata data) external override returns (bytes memory) {
        require(msg.sender == address(poolManager), "Only pool manager");
        
        CallbackData memory callbackData = abi.decode(data, (CallbackData));
        
        // Initialize the pool
        poolManager.initialize(callbackData.key, callbackData.sqrtPriceX96);
        
        return "";
    }
}