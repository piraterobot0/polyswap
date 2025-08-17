// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {TickMath} from "v4-core/src/libraries/TickMath.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {StateLibrary} from "v4-core/src/libraries/StateLibrary.sol";
import {PoolSwapTest} from "v4-core/src/test/PoolSwapTest.sol";
import {FlexiblePredictionHook} from "../src/FlexiblePredictionHook.sol";
import {IERC20} from "v4-core/lib/forge-std/src/interfaces/IERC20.sol";
import {MockERC20} from "v4-core/lib/solmate/src/test/utils/mocks/MockERC20.sol";
import {Deployers} from "v4-core/test/utils/Deployers.sol";

contract FlexiblePredictionHookLiquidityTest is Test, Deployers {
    using PoolIdLibrary for PoolKey;
    using StateLibrary for IPoolManager;

    FlexiblePredictionHook hook;
    PoolKey poolKey;
    PoolId poolId;
    MockERC20 token0;
    MockERC20 token1;

    address alice = address(0x1);
    address bob = address(0x2);
    address charlie = address(0x3);

    function setUp() public {
        // Deploy pool manager and hook infrastructure
        deployFreshManagerAndRouters();
        deployMintAndApprove2Currencies();
        
        // Deploy the hook
        address hookAddress = address(uint160(Hooks.BEFORE_ADD_LIQUIDITY_FLAG | Hooks.BEFORE_SWAP_FLAG | Hooks.BEFORE_SWAP_RETURNS_DELTA_FLAG));
        deployCodeTo("FlexiblePredictionHook.sol", abi.encode(manager), hookAddress);
        hook = FlexiblePredictionHook(hookAddress);

        // Create the pool with our hook
        poolKey = PoolKey(
            Currency.wrap(address(currency0)),
            Currency.wrap(address(currency1)),
            3000,
            60,
            IHooks(hook)
        );
        poolId = poolKey.toId();
        
        // Initialize the pool
        manager.initialize(poolKey, SQRT_PRICE_1_1);
        
        // Cast currencies to MockERC20 for easier testing
        token0 = MockERC20(Currency.unwrap(poolKey.currency0));
        token1 = MockERC20(Currency.unwrap(poolKey.currency1));
        
        // Fund test accounts
        token0.mint(alice, 1000e18);
        token1.mint(alice, 1000e18);
        token0.mint(bob, 1000e18);
        token1.mint(bob, 1000e18);
        token0.mint(charlie, 1000e18);
        token1.mint(charlie, 1000e18);
    }

    function testAddLiquidityFirstProvider() public {
        vm.startPrank(alice);
        
        uint256 amount0 = 100e18;
        uint256 amount1 = 100e18;
        
        // Approve tokens
        token0.approve(address(hook), amount0);
        token1.approve(address(hook), amount1);
        
        // Add liquidity
        uint256 shares = hook.addLiquidity(poolKey, amount0, amount1);
        
        // Check shares (should equal total liquidity for first provider)
        assertEq(shares, amount0 + amount1);
        assertEq(hook.totalShares(poolId), shares);
        assertEq(hook.lpShares(poolId, alice), shares);
        
        // Check reserves
        (uint256 r0, uint256 r1) = hook.getReserves(poolKey);
        assertEq(r0, amount0);
        assertEq(r1, amount1);
        assertEq(hook.totalLiquidity(poolId), amount0 + amount1);
        
        vm.stopPrank();
    }

    function testAddLiquidityMultipleProviders() public {
        // Alice adds initial liquidity
        vm.startPrank(alice);
        token0.approve(address(hook), 100e18);
        token1.approve(address(hook), 100e18);
        uint256 aliceShares = hook.addLiquidity(poolKey, 100e18, 100e18);
        vm.stopPrank();
        
        // Bob adds liquidity
        vm.startPrank(bob);
        token0.approve(address(hook), 50e18);
        token1.approve(address(hook), 50e18);
        uint256 bobShares = hook.addLiquidity(poolKey, 50e18, 50e18);
        vm.stopPrank();
        
        // Check shares proportions
        // Bob added 100 tokens total, Alice had 200, so Bob should get 1/2 of Alice's shares
        assertEq(bobShares, aliceShares / 2);
        assertEq(hook.totalShares(poolId), aliceShares + bobShares);
        assertEq(hook.lpShares(poolId, alice), aliceShares);
        assertEq(hook.lpShares(poolId, bob), bobShares);
        
        // Check total reserves
        (uint256 r0, uint256 r1) = hook.getReserves(poolKey);
        assertEq(r0, 150e18);
        assertEq(r1, 150e18);
    }

    function testRemoveLiquidity() public {
        // Alice adds liquidity
        vm.startPrank(alice);
        token0.approve(address(hook), 100e18);
        token1.approve(address(hook), 100e18);
        uint256 aliceShares = hook.addLiquidity(poolKey, 100e18, 100e18);
        
        // Remove half of liquidity
        uint256 sharesToRemove = aliceShares / 2;
        (uint256 removed0, uint256 removed1) = hook.removeLiquidity(poolKey, sharesToRemove);
        
        // Check amounts
        assertEq(removed0, 50e18);
        assertEq(removed1, 50e18);
        
        // Check remaining shares
        assertEq(hook.lpShares(poolId, alice), aliceShares - sharesToRemove);
        assertEq(hook.totalShares(poolId), aliceShares - sharesToRemove);
        
        // Check reserves
        (uint256 r0, uint256 r1) = hook.getReserves(poolKey);
        assertEq(r0, 50e18);
        assertEq(r1, 50e18);
        
        vm.stopPrank();
    }

    function testRemoveAllLiquidity() public {
        // Alice adds liquidity
        vm.startPrank(alice);
        token0.approve(address(hook), 100e18);
        token1.approve(address(hook), 100e18);
        hook.addLiquidity(poolKey, 100e18, 100e18);
        
        // Remove all liquidity
        (uint256 removed0, uint256 removed1) = hook.removeAllLiquidity(poolKey);
        
        // Check amounts
        assertEq(removed0, 100e18);
        assertEq(removed1, 100e18);
        
        // Check shares are zero
        assertEq(hook.lpShares(poolId, alice), 0);
        assertEq(hook.totalShares(poolId), 0);
        
        // Check reserves are zero
        (uint256 r0, uint256 r1) = hook.getReserves(poolKey);
        assertEq(r0, 0);
        assertEq(r1, 0);
        
        vm.stopPrank();
    }

    function testGetUserPosition() public {
        // Alice adds liquidity
        vm.startPrank(alice);
        token0.approve(address(hook), 100e18);
        token1.approve(address(hook), 100e18);
        hook.addLiquidity(poolKey, 100e18, 100e18);
        vm.stopPrank();
        
        // Bob adds liquidity
        vm.startPrank(bob);
        token0.approve(address(hook), 50e18);
        token1.approve(address(hook), 50e18);
        hook.addLiquidity(poolKey, 50e18, 50e18);
        vm.stopPrank();
        
        // Check Alice's position
        (
            uint256 shares,
            uint256 shareOfPool,
            uint256 deposited0,
            uint256 deposited1,
            uint256 claimable0,
            uint256 claimable1
        ) = hook.getUserPosition(poolKey, alice);
        
        assertEq(shares, 200e18); // Alice's shares
        assertEq(shareOfPool, (200e18 * 1e18) / 300e18); // 2/3 of pool
        assertEq(deposited0, 100e18);
        assertEq(deposited1, 100e18);
        assertEq(claimable0, 100e18); // Can claim 2/3 of 150e18
        assertEq(claimable1, 100e18);
    }

    function testAddAvailableLiquidity() public {
        vm.startPrank(alice);
        
        // Approve all tokens
        token0.approve(address(hook), type(uint256).max);
        token1.approve(address(hook), type(uint256).max);
        
        // Add all available liquidity
        uint256 shares = hook.addAvailableLiquidity(poolKey);
        
        // Check that all tokens were added
        assertEq(token0.balanceOf(alice), 0);
        assertEq(token1.balanceOf(alice), 0);
        assertEq(shares, 2000e18); // 1000e18 + 1000e18
        
        // Check reserves
        (uint256 r0, uint256 r1) = hook.getReserves(poolKey);
        assertEq(r0, 1000e18);
        assertEq(r1, 1000e18);
        
        vm.stopPrank();
    }

    function testLiquidityWithUnbalancedAmounts() public {
        vm.startPrank(alice);
        
        // Add unbalanced liquidity (more token0 than token1)
        token0.approve(address(hook), 150e18);
        token1.approve(address(hook), 50e18);
        uint256 shares = hook.addLiquidity(poolKey, 150e18, 50e18);
        
        // Check shares
        assertEq(shares, 200e18); // Total liquidity
        
        // Check reserves reflect unbalanced pool
        (uint256 r0, uint256 r1) = hook.getReserves(poolKey);
        assertEq(r0, 150e18);
        assertEq(r1, 50e18);
        
        // Check prices (as percentages)
        (uint256 price0, uint256 price1) = hook.getPrices(poolKey);
        assertEq(price0, 75); // 150/200 = 75%
        assertEq(price1, 25); // 50/200 = 25%
        
        vm.stopPrank();
    }

    function testCannotRemoveMoreSharesThanOwned() public {
        vm.startPrank(alice);
        token0.approve(address(hook), 100e18);
        token1.approve(address(hook), 100e18);
        uint256 shares = hook.addLiquidity(poolKey, 100e18, 100e18);
        
        // Try to remove more shares than owned
        vm.expectRevert("Insufficient shares");
        hook.removeLiquidity(poolKey, shares + 1);
        
        vm.stopPrank();
    }

    function testProportionalWithdrawalAfterSwaps() public {
        // Alice adds initial liquidity
        vm.startPrank(alice);
        token0.approve(address(hook), 100e18);
        token1.approve(address(hook), 100e18);
        uint256 aliceShares = hook.addLiquidity(poolKey, 100e18, 100e18);
        vm.stopPrank();
        
        // Simulate some swaps changing the reserves
        // (In real scenario, swaps would happen through the pool manager)
        // For testing, we'll add Bob's liquidity with different ratios
        vm.startPrank(bob);
        token0.approve(address(hook), 80e18);
        token1.approve(address(hook), 20e18);
        hook.addLiquidity(poolKey, 80e18, 20e18);
        vm.stopPrank();
        
        // Now reserves are 180 token0, 120 token1
        // Alice owns 2/3 of the pool (200 shares out of 300)
        
        vm.startPrank(alice);
        (uint256 withdrawn0, uint256 withdrawn1) = hook.removeAllLiquidity(poolKey);
        
        // Alice should get 2/3 of each reserve
        assertEq(withdrawn0, 120e18); // 2/3 of 180
        assertEq(withdrawn1, 80e18);  // 2/3 of 120
        
        vm.stopPrank();
    }
}