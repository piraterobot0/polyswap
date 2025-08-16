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

/// @title PredictionMarketHook
/// @author Nora AI
/// @notice This hook implements a constant-sum automated market maker (CSAMM) for a binary prediction market.
/// It overrides the default swap and liquidity logic of a Uniswap v4 pool.
///
/// Key characteristics:
/// - The hook maintains its own internal reserves for "YES" and "NO" outcome tokens.
/// - The sum of the reserves (`yesReserve + noReserve`) is always equal to the total liquidity (`totalLiquidity`),
///   creating a constant-sum model where tokens are swapped 1-for-1.
/// - The price of an outcome is determined by the ratio of its reserve to the total liquidity.
/// - It disallows standard v4 liquidity provision, requiring liquidity to be added through a custom `addInitialLiquidity` function.
/// - It takes full control of the token accounting within the pool by using the `mint` and `burn` functions of the PoolManager.
contract PredictionMarketHook is BaseHook, SafeCallback {
    using SafeCast for uint256;
    using PoolIdLibrary for PoolKey;

    /// @notice The scaling factor for price calculations, representing 100% with 18 decimals.
    uint256 public constant SCALE = 1e18;
    /// @notice The initial ratio of the "YES" token reserve when liquidity is first added.
    uint256 public constant INITIAL_YES_RATIO = 80;
    /// @notice The initial ratio of the "NO" token reserve when liquidity is first added.
    uint256 public constant INITIAL_NO_RATIO = 20;
    
    /// @notice Stores the total liquidity for each pool, which remains constant after initialization.
    mapping(PoolId => uint256) public totalLiquidity;
    /// @notice Stores the reserve of the "YES" token (currency0) for each pool.
    mapping(PoolId => uint256) public yesReserve;
    /// @notice Stores the reserve of the "NO" token (currency1) for each pool.
    mapping(PoolId => uint256) public noReserve;

    constructor(IPoolManager poolManager_) SafeCallback(poolManager_) {}

    /// @dev Internal function to access the PoolManager, required by `BaseHook`.
    function _poolManager() internal view override returns (IPoolManager) {
        return poolManager;
    }

    /// @notice Specifies which hook callbacks this contract implements.
    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: true, // Intercepts and blocks standard liquidity additions.
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true, // Overrides the swap logic with the constant-sum model.
            afterSwap: false,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false, // Recommended to be true if beforeSwap is true, but false here. See comment below.
            // REVIEW: Although `beforeSwap` is implemented, `beforeSwapReturnDelta` is false.
            // While not strictly required, it's a common pattern to implement `beforeSwapReturnDelta`
            // to validate the swap outcome. By setting it to false, the hook relies solely on its own
            // internal logic and the PoolManager's accounting.
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    /// @notice This function is called before every swap and implements the core CSAMM logic.
    /// @dev It overrides the pool's AMM by calculating the swap amounts itself,
    /// updating its internal reserves, and instructing the PoolManager to mint/burn tokens to/from the hook.
    function _beforeSwap(address, PoolKey calldata key, IPoolManager.SwapParams calldata params, bytes calldata)
        internal
        override
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        PoolId poolId = key.toId();
        uint256 k = totalLiquidity[poolId];
        require(k > 0, "PredictionMarketHook: No liquidity in the pool.");
        
        // Determine the direction of the swap.
        (Currency inputCurrency, Currency outputCurrency) =
            params.zeroForOne ? (key.currency0, key.currency1) : (key.currency1, key.currency0);

        // Determine the swap amount, which is always positive.
        // `amountSpecified` is negative for exact input, positive for exact output.
        bool isExactInput = params.amountSpecified < 0;
        uint256 amount = isExactInput ? uint256(-params.amountSpecified) : uint256(params.amountSpecified);

        // Get the current reserves for the input and output tokens.
        uint256 inputReserve = params.zeroForOne ? yesReserve[poolId] : noReserve[poolId];
        uint256 outputReserve = params.zeroForOne ? noReserve[poolId] : yesReserve[poolId];
        
        // --- VULNERABILITY & LOGIC CHECK ---
        // These checks correctly enforce the constant-sum invariant.
        require(inputReserve + amount <= k, "PredictionMarketHook: Swap would exceed max reserve.");
        require(outputReserve >= amount, "PredictionMarketHook: Insufficient reserve for swap.");
        
        // Update the internal reserves based on the 1-for-1 swap.
        if (params.zeroForOne) {
            yesReserve[poolId] += amount;
            noReserve[poolId] -= amount;
        } else {
            noReserve[poolId] += amount;
            yesReserve[poolId] -= amount;
        }

        // --- HOOK-CONTROLLED ACCOUNTING ---
        // The hook takes custody of the input tokens by minting them to itself
        // and provides the output tokens by burning them from its own balance within the PoolManager.
        // This bypasses the pool's AMM entirely.
        poolManager.mint(address(this), inputCurrency.toId(), amount);
        poolManager.burn(address(this), outputCurrency.toId(), amount);

        // --- BUG FIX ---
        // The original `returnDelta` logic incorrectly adjusted the swapper's balance.
        // This has been corrected to ensure the swapper's balance of the token they are selling decreases,
        // and the balance of the token they are buying increases.
        // The logic now correctly reflects the direction of the swap (`params.zeroForOne`).
        BeforeSwapDelta returnDelta;
        if (params.zeroForOne) {
            // Swapper gives currency0, receives currency1.
            // Decrease currency0 balance, increase currency1 balance.
            returnDelta = toBeforeSwapDelta(-amount.toInt128(), amount.toInt128());
        } else {
            // Swapper gives currency1, receives currency0.
            // Increase currency0 balance, decrease currency1 balance.
            returnDelta = toBeforeSwapDelta(amount.toInt128(), -amount.toInt128());
        }

        return (BaseHook.beforeSwap.selector, returnDelta, 0);
    }

    /// @notice This function intercepts and blocks anyone from adding liquidity through the standard PoolManager.
    /// @dev It reverts to enforce the use of the custom `addInitialLiquidity` function.
    function _beforeAddLiquidity(address, PoolKey calldata, IPoolManager.ModifyLiquidityParams calldata, bytes calldata)
        internal
        pure
        override
        returns (bytes4)
    {
        revert("PredictionMarketHook: Standard liquidity provision is not allowed. Use addInitialLiquidity().");
    }

    /// @notice Adds the initial liquidity to the prediction market.
    /// @dev This is the only way to add liquidity. It uses the `unlock` mechanism for safe token transfers.
    /// @param key The PoolKey identifying the Uniswap v4 pool.
    /// @param totalAmount The total amount of tokens to be supplied as liquidity, which will be split
    ///        between YES and NO tokens based on the initial ratios.
    function addInitialLiquidity(PoolKey calldata key, uint256 totalAmount) external {
        // SUGGESTION: For greater flexibility, consider passing `initialYesRatio` as a parameter
        // instead of using a hardcoded constant. This would require ensuring the ratios sum to 100.
        uint256 yesAmount = (totalAmount * INITIAL_YES_RATIO) / 100;
        uint256 noAmount = (totalAmount * INITIAL_NO_RATIO) / 100;
        
        // The `unlock` mechanism requests the PoolManager to call this contract back (`_unlockCallback`)
        // to perform the token transfers and state updates. This is the safest way to handle tokens in v4.
        poolManager.unlock(abi.encode(msg.sender, key, yesAmount, noAmount, totalAmount));
    }

    /// @notice The callback function executed by the PoolManager after `unlock` is called.
    /// @dev It handles the token transfers from the liquidity provider and initializes the hook's internal state.
    function _unlockCallback(bytes calldata data) internal virtual override returns (bytes memory) {
        (address payer, PoolKey memory key, uint256 yesAmount, uint256 noAmount, uint256 totalAmount) =
            abi.decode(data, (address, PoolKey, uint256, uint256, uint256));

        PoolId poolId = key.toId();
        
        // Ensure this is the first time liquidity is added to prevent re-initialization.
        require(totalLiquidity[poolId] == 0, "PredictionMarketHook: Liquidity already initialized.");

        // Pull YES tokens (currency0) from the payer to the PoolManager.
        poolManager.sync(key.currency0);
        IERC20(Currency.unwrap(key.currency0)).transferFrom(payer, address(poolManager), yesAmount);
        poolManager.settle();

        // Pull NO tokens (currency1) from the payer to the PoolManager.
        poolManager.sync(key.currency1);
        IERC20(Currency.unwrap(key.currency1)).transferFrom(payer, address(poolManager), noAmount);
        poolManager.settle();

        // Grant the hook contract a balance of YES and NO tokens within the PoolManager's accounting system.
        poolManager.mint(address(this), key.currency0.toId(), yesAmount);
        poolManager.mint(address(this), key.currency1.toId(), noAmount);

        // Initialize the internal state of the prediction market.
        yesReserve[poolId] = yesAmount;
        noReserve[poolId] = noAmount;
        totalLiquidity[poolId] = totalAmount;

        // SUGGESTION: Emit an event to signal that liquidity has been added.
        // emit LiquidityAdded(poolId, payer, totalAmount);
        return "";
    }
    
    /// @notice Calculates the current price of the YES and NO outcome tokens.
    /// @param key The PoolKey identifying the Uniswap v4 pool.
    /// @return yesPrice The price of the YES token (scaled by 1e18).
    /// @return noPrice The price of the NO token (scaled by 1e18).
    function getPrice(PoolKey calldata key) external view returns (uint256 yesPrice, uint256 noPrice) {
        PoolId poolId = key.toId();
        uint256 k = totalLiquidity[poolId];
        if (k == 0) return (0, 0);
        
        // Price is the ratio of the reserve to the total liquidity.
        yesPrice = (yesReserve[poolId] * SCALE) / k;
        noPrice = (noReserve[poolId] * SCALE) / k;
    }
}