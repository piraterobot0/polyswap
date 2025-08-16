// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, toBeforeSwapDelta} from "v4-core/src/types/BeforeSwapDelta.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {SafeCast} from "v4-core/src/libraries/SafeCast.sol";
import {ModifyLiquidityParams, SwapParams} from "v4-core/src/types/PoolOperation.sol";
import {IERC20} from "v4-core/lib/forge-std/src/interfaces/IERC20.sol";

contract PredictionMarketHookSimple is IHooks {
    using SafeCast for uint256;
    using PoolIdLibrary for PoolKey;

    error HookNotCalledByPoolManager();

    IPoolManager public immutable poolManager;
    
    uint256 public constant SCALE = 1e18;
    uint256 public constant INITIAL_YES_RATIO = 80;
    uint256 public constant INITIAL_NO_RATIO = 20;
    
    mapping(PoolId => uint256) public totalLiquidity;
    mapping(PoolId => uint256) public yesReserve;
    mapping(PoolId => uint256) public noReserve;

    modifier onlyPoolManager() {
        if (msg.sender != address(poolManager)) revert HookNotCalledByPoolManager();
        _;
    }

    constructor(IPoolManager _poolManager) {
        poolManager = _poolManager;
        validateHookAddress();
    }

    function validateHookAddress() internal view {
        Hooks.validateHookPermissions(this, getHookPermissions());
    }

    function getHookPermissions() public pure returns (Hooks.Permissions memory) {
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

    function beforeInitialize(address, PoolKey calldata, uint160) external pure returns (bytes4) {
        return IHooks.beforeInitialize.selector;
    }

    function afterInitialize(address, PoolKey calldata, uint160, int24) external pure returns (bytes4) {
        return IHooks.afterInitialize.selector;
    }

    function beforeSwap(
        address,
        PoolKey calldata key,
        SwapParams calldata params,
        bytes calldata
    ) external onlyPoolManager returns (bytes4, BeforeSwapDelta, uint24) {
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

        return (IHooks.beforeSwap.selector, returnDelta, 0);
    }

    function afterSwap(
        address,
        PoolKey calldata,
        SwapParams calldata,
        BalanceDelta,
        bytes calldata
    ) external pure returns (bytes4, int128) {
        return (IHooks.afterSwap.selector, 0);
    }

    function beforeAddLiquidity(
        address,
        PoolKey calldata,
        ModifyLiquidityParams calldata,
        bytes calldata
    ) external pure returns (bytes4) {
        revert("No v4 Liquidity allowed");
    }

    function afterAddLiquidity(
        address,
        PoolKey calldata,
        ModifyLiquidityParams calldata,
        BalanceDelta,
        BalanceDelta,
        bytes calldata
    ) external pure returns (bytes4, BalanceDelta) {
        return (IHooks.afterAddLiquidity.selector, BalanceDelta.wrap(0));
    }

    function beforeRemoveLiquidity(
        address,
        PoolKey calldata,
        ModifyLiquidityParams calldata,
        bytes calldata
    ) external pure returns (bytes4) {
        return IHooks.beforeRemoveLiquidity.selector;
    }

    function afterRemoveLiquidity(
        address,
        PoolKey calldata,
        ModifyLiquidityParams calldata,
        BalanceDelta,
        BalanceDelta,
        bytes calldata
    ) external pure returns (bytes4, BalanceDelta) {
        return (IHooks.afterRemoveLiquidity.selector, BalanceDelta.wrap(0));
    }

    function beforeDonate(
        address,
        PoolKey calldata,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return IHooks.beforeDonate.selector;
    }

    function afterDonate(
        address,
        PoolKey calldata,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return IHooks.afterDonate.selector;
    }

    function addInitialLiquidity(PoolKey calldata key, uint256 totalAmount) external {
        PoolId poolId = key.toId();
        require(totalLiquidity[poolId] == 0, "Already initialized");
        
        uint256 yesAmount = (totalAmount * INITIAL_YES_RATIO) / 100;
        uint256 noAmount = (totalAmount * INITIAL_NO_RATIO) / 100;
        
        IERC20(Currency.unwrap(key.currency0)).transferFrom(msg.sender, address(poolManager), yesAmount);
        IERC20(Currency.unwrap(key.currency1)).transferFrom(msg.sender, address(poolManager), noAmount);
        
        poolManager.mint(address(this), key.currency0.toId(), yesAmount);
        poolManager.mint(address(this), key.currency1.toId(), noAmount);
        
        yesReserve[poolId] = yesAmount;
        noReserve[poolId] = noAmount;
        totalLiquidity[poolId] = totalAmount;
    }
    
    function getPrice(PoolKey calldata key) external view returns (uint256 yesPrice, uint256 noPrice) {
        PoolId poolId = key.toId();
        uint256 k = totalLiquidity[poolId];
        if (k == 0) return (0, 0);
        
        yesPrice = (yesReserve[poolId] * SCALE) / k;
        noPrice = (noReserve[poolId] * SCALE) / k;
    }
}