// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {BaseHook} from "./forks/BaseHook.sol";
import {SafeCallback} from "v4-periphery/src/base/SafeCallback.sol";
import {ImmutableState} from "v4-periphery/src/base/ImmutableState.sol";

import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, toBeforeSwapDelta} from "v4-core/src/types/BeforeSwapDelta.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {SafeCast} from "v4-core/src/libraries/SafeCast.sol";
import {ModifyLiquidityParams, SwapParams} from "v4-core/src/types/PoolOperation.sol";

contract PredictionMarketHookCustom is BaseHook, SafeCallback {
    using SafeCast for uint256;
    using PoolIdLibrary for PoolKey;

    uint256 public constant SCALE = 1e18;
    
    mapping(PoolId => uint256) public totalLiquidity;
    mapping(PoolId => uint256) public yesReserve;
    mapping(PoolId => uint256) public noReserve;

    constructor(IPoolManager poolManager_) SafeCallback(poolManager_) {}

    function _poolManager() internal view override returns (IPoolManager) {
        return poolManager;
    }

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: true,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: false,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: true,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function _beforeSwap(address, PoolKey calldata key, SwapParams calldata params, bytes calldata)
        internal
        override
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        PoolId poolId = key.toId();
        uint256 k = totalLiquidity[poolId];
        require(k > 0, "No liquidity");
        
        (Currency inputCurrency, Currency outputCurrency) =
            params.zeroForOne ? (key.currency0, key.currency1) : (key.currency1, key.currency0);

        bool isExactInput = params.amountSpecified < 0;
        uint256 amount = isExactInput ? uint256(-params.amountSpecified) : uint256(params.amountSpecified);

        uint256 inputReserve = params.zeroForOne ? yesReserve[poolId] : noReserve[poolId];
        uint256 outputReserve = params.zeroForOne ? noReserve[poolId] : yesReserve[poolId];
        
        require(inputReserve + amount <= k, "Exceeds max reserve");
        require(outputReserve >= amount, "Insufficient reserve");
        
        if (params.zeroForOne) {
            yesReserve[poolId] += amount;
            noReserve[poolId] -= amount;
        } else {
            noReserve[poolId] += amount;
            yesReserve[poolId] -= amount;
        }

        poolManager.mint(address(this), inputCurrency.toId(), amount);
        poolManager.burn(address(this), outputCurrency.toId(), amount);

        int128 tokenAmount = amount.toInt128();
        BeforeSwapDelta returnDelta =
            isExactInput ? toBeforeSwapDelta(tokenAmount, -tokenAmount) : toBeforeSwapDelta(-tokenAmount, tokenAmount);

        return (BaseHook.beforeSwap.selector, returnDelta, 0);
    }

    function _beforeAddLiquidity(address, PoolKey calldata, ModifyLiquidityParams calldata, bytes calldata)
        internal
        pure
        override
        returns (bytes4)
    {
        revert("No v4 Liquidity allowed");
    }

    // Modified to accept exact amounts of YES and NO tokens
    function addLiquidityCustom(PoolKey calldata key, uint256 yesAmount, uint256 noAmount) external {
        poolManager.unlock(abi.encode(msg.sender, key, yesAmount, noAmount));
    }

    function _unlockCallback(bytes calldata data) internal virtual override returns (bytes memory) {
        (address payer, PoolKey memory key, uint256 yesAmount, uint256 noAmount) =
            abi.decode(data, (address, PoolKey, uint256, uint256));

        PoolId poolId = key.toId();
        
        // Allow adding to existing liquidity
        
        // Pull YES tokens from the payer
        poolManager.sync(key.currency0);
        IERC20(Currency.unwrap(key.currency0)).transferFrom(payer, address(poolManager), yesAmount);
        poolManager.settle();

        // Pull NO tokens from the payer
        poolManager.sync(key.currency1);
        IERC20(Currency.unwrap(key.currency1)).transferFrom(payer, address(poolManager), noAmount);
        poolManager.settle();

        // Mint tokens to the hook
        poolManager.mint(address(this), key.currency0.toId(), yesAmount);
        poolManager.mint(address(this), key.currency1.toId(), noAmount);

        // Update reserves
        yesReserve[poolId] += yesAmount;
        noReserve[poolId] += noAmount;
        totalLiquidity[poolId] = yesReserve[poolId] + noReserve[poolId];

        return "";
    }
    
    function getPrice(PoolKey calldata key) external view returns (uint256 yesPrice, uint256 noPrice) {
        PoolId poolId = key.toId();
        uint256 k = totalLiquidity[poolId];
        if (k == 0) return (0, 0);
        
        yesPrice = (yesReserve[poolId] * SCALE) / k;
        noPrice = (noReserve[poolId] * SCALE) / k;
    }
}