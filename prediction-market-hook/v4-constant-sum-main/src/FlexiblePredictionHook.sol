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

/// @title Flexible Prediction Market Hook
/// @notice Constant Sum AMM (X+Y=K) that accepts any amount of liquidity
/// @dev Improved version that works with minimal token amounts
contract FlexiblePredictionHook is IHooks {
    using SafeCast for uint256;
    using SafeCast for int256;
    using PoolIdLibrary for PoolKey;

    error HookNotCalledByPoolManager();
    error NoLiquidity();
    error InsufficientReserve();
    error AlreadyInitialized();

    IPoolManager public immutable poolManager;
    
    uint256 public constant SCALE = 1e18;
    
    // State for each pool
    mapping(PoolId => uint256) public totalLiquidity;
    mapping(PoolId => uint256) public reserve0;  // First token reserve
    mapping(PoolId => uint256) public reserve1;  // Second token reserve
    mapping(PoolId => uint256) public initialRatio0; // Initial % for token0 (0-100)
    
    // Events
    event LiquidityAdded(PoolId indexed poolId, uint256 amount0, uint256 amount1);
    event SwapExecuted(PoolId indexed poolId, bool zeroForOne, uint256 amountIn, uint256 amountOut);

    modifier onlyPoolManager() {
        if (msg.sender != address(poolManager)) revert HookNotCalledByPoolManager();
        _;
    }

    constructor(IPoolManager _poolManager) {
        poolManager = _poolManager;
    }

    function getHookPermissions() public pure returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: true,  // Block normal liquidity
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: false,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: true,  // Handle swap accounting
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    // ===== Hook Functions =====

    function beforeInitialize(address, PoolKey calldata, uint160) external pure returns (bytes4) {
        return IHooks.beforeInitialize.selector;
    }

    function afterInitialize(address, PoolKey calldata, uint160, int24) external pure returns (bytes4) {
        return IHooks.afterInitialize.selector;
    }

    function beforeAddLiquidity(
        address,
        PoolKey calldata,
        ModifyLiquidityParams calldata,
        bytes calldata
    ) external pure returns (bytes4) {
        revert("Use addLiquidity function instead");
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

    function beforeSwap(
        address,
        PoolKey calldata key,
        SwapParams calldata params,
        bytes calldata
    ) external onlyPoolManager returns (bytes4, BeforeSwapDelta, uint24) {
        return _handleSwap(key, params);
    }
    
    function _handleSwap(PoolKey calldata key, SwapParams calldata params) 
        private 
        returns (bytes4, BeforeSwapDelta, uint24) 
    {
        PoolId poolId = key.toId();
        
        uint256 k = totalLiquidity[poolId];
        if (k == 0) revert NoLiquidity();
        
        // Get current reserves
        uint256 r0 = reserve0[poolId];
        uint256 r1 = reserve1[poolId];
        
        // Calculate swap amounts
        uint256 amountIn = params.amountSpecified > 0 
            ? uint256(params.amountSpecified)
            : uint256(-params.amountSpecified);
            
        uint256 amountOut;
        
        if (params.zeroForOne) {
            // Swapping token0 for token1
            if (amountIn > r0) revert InsufficientReserve();
            
            amountOut = amountIn;
            if (amountOut > r1) {
                amountOut = r1;
            }
            
            // Update reserves
            reserve0[poolId] = r0 + amountIn;
            reserve1[poolId] = r1 - amountOut;
            
            // Handle accounting
            _mintBurn(key.currency0, key.currency1, amountIn, amountOut);
            
        } else {
            // Swapping token1 for token0
            if (amountIn > r1) revert InsufficientReserve();
            
            amountOut = amountIn;
            if (amountOut > r0) {
                amountOut = r0;
            }
            
            // Update reserves
            reserve0[poolId] = r0 - amountOut;
            reserve1[poolId] = r1 + amountIn;
            
            // Handle accounting
            _mintBurn(key.currency1, key.currency0, amountIn, amountOut);
        }
        
        emit SwapExecuted(poolId, params.zeroForOne, amountIn, amountOut);
        
        // Return the swap delta
        BeforeSwapDelta delta;
        if (params.zeroForOne) {
            delta = toBeforeSwapDelta(amountIn.toInt128(), -(amountOut.toInt128()));
        } else {
            delta = toBeforeSwapDelta(-(amountOut.toInt128()), amountIn.toInt128());
        }
        
        return (IHooks.beforeSwap.selector, delta, 0);
    }
    
    function _mintBurn(Currency currencyIn, Currency currencyOut, uint256 amountIn, uint256 amountOut) private {
        poolManager.mint(address(this), currencyIn.toId(), amountIn);
        poolManager.burn(address(this), currencyOut.toId(), amountOut);
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

    function beforeDonate(address, PoolKey calldata, uint256, uint256, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        return IHooks.beforeDonate.selector;
    }

    function afterDonate(address, PoolKey calldata, uint256, uint256, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        return IHooks.afterDonate.selector;
    }

    // ===== Custom Liquidity Functions =====

    /// @notice Add liquidity with any amounts
    /// @param key Pool key
    /// @param amount0 Amount of token0
    /// @param amount1 Amount of token1
    function addLiquidity(PoolKey calldata key, uint256 amount0, uint256 amount1) external {
        require(amount0 > 0 || amount1 > 0, "Must provide tokens");
        
        PoolId poolId = key.toId();
        
        // Transfer tokens to pool manager
        if (amount0 > 0) {
            IERC20(Currency.unwrap(key.currency0)).transferFrom(
                msg.sender,
                address(poolManager),
                amount0
            );
            poolManager.mint(address(this), key.currency0.toId(), amount0);
        }
        
        if (amount1 > 0) {
            IERC20(Currency.unwrap(key.currency1)).transferFrom(
                msg.sender,
                address(poolManager),
                amount1
            );
            poolManager.mint(address(this), key.currency1.toId(), amount1);
        }
        
        // Update state
        reserve0[poolId] += amount0;
        reserve1[poolId] += amount1;
        totalLiquidity[poolId] += (amount0 + amount1);
        
        emit LiquidityAdded(poolId, amount0, amount1);
    }

    /// @notice Add initial liquidity with whatever tokens you have
    /// @param key Pool key
    function addAvailableLiquidity(PoolKey calldata key) external {
        PoolId poolId = key.toId();
        
        // Get sender's balances
        uint256 balance0 = IERC20(Currency.unwrap(key.currency0)).balanceOf(msg.sender);
        uint256 balance1 = IERC20(Currency.unwrap(key.currency1)).balanceOf(msg.sender);
        
        require(balance0 > 0 || balance1 > 0, "No tokens available");
        
        // Transfer tokens to pool manager
        if (balance0 > 0) {
            IERC20(Currency.unwrap(key.currency0)).transferFrom(
                msg.sender,
                address(poolManager),
                balance0
            );
            poolManager.mint(address(this), key.currency0.toId(), balance0);
        }
        
        if (balance1 > 0) {
            IERC20(Currency.unwrap(key.currency1)).transferFrom(
                msg.sender,
                address(poolManager),
                balance1
            );
            poolManager.mint(address(this), key.currency1.toId(), balance1);
        }
        
        // Update state
        reserve0[poolId] += balance0;
        reserve1[poolId] += balance1;
        totalLiquidity[poolId] += (balance0 + balance1);
        
        emit LiquidityAdded(poolId, balance0, balance1);
    }

    /// @notice Set initial price ratio (call before adding first liquidity)
    /// @param key Pool key
    /// @param ratio0 Percentage for token0 (0-100)
    function setInitialRatio(PoolKey calldata key, uint256 ratio0) external {
        require(ratio0 <= 100, "Invalid ratio");
        PoolId poolId = key.toId();
        require(totalLiquidity[poolId] == 0, "Already has liquidity");
        
        initialRatio0[poolId] = ratio0;
    }

    // ===== View Functions =====

    /// @notice Get current reserves
    function getReserves(PoolKey calldata key) external view returns (uint256 r0, uint256 r1) {
        PoolId poolId = key.toId();
        return (reserve0[poolId], reserve1[poolId]);
    }

    /// @notice Get current prices as percentages
    function getPrices(PoolKey calldata key) external view returns (uint256 price0, uint256 price1) {
        PoolId poolId = key.toId();
        uint256 k = totalLiquidity[poolId];
        
        if (k == 0) return (0, 0);
        
        price0 = (reserve0[poolId] * 100) / k;
        price1 = (reserve1[poolId] * 100) / k;
    }

    /// @notice Get pool info
    function getPoolInfo(PoolKey calldata key) external view returns (
        uint256 liquidity,
        uint256 r0,
        uint256 r1,
        uint256 price0,
        uint256 price1
    ) {
        PoolId poolId = key.toId();
        liquidity = totalLiquidity[poolId];
        r0 = reserve0[poolId];
        r1 = reserve1[poolId];
        
        if (liquidity > 0) {
            price0 = (r0 * 100) / liquidity;
            price1 = (r1 * 100) / liquidity;
        }
    }
}