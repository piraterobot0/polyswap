// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {PredictionMarketHook} from "../src/PredictionMarketHook.sol";
import {Fixtures} from "./utils/Fixtures.sol";

contract PredictionMarketTest is Test, Fixtures {
    PredictionMarketHook hook;
    
    function setUp() public {
        deployFreshManagerAndRouters();
        deployMintAndApprove2Currencies();
        deployAndApprovePosm(manager);

        address flags = address(
            uint160(Hooks.BEFORE_SWAP_FLAG | Hooks.BEFORE_SWAP_RETURNS_DELTA_FLAG | Hooks.BEFORE_ADD_LIQUIDITY_FLAG)
                ^ (0x4444 << 144)
        );
        
        bytes memory constructorArgs = abi.encode(manager);
        deployCodeTo("PredictionMarketHook.sol:PredictionMarketHook", constructorArgs, flags);
        hook = PredictionMarketHook(flags);

        key = PoolKey(currency0, currency1, 3000, 60, IHooks(hook));
        manager.initialize(key, SQRT_PRICE_1_1);

        IERC20(Currency.unwrap(currency0)).approve(address(hook), type(uint256).max);
        IERC20(Currency.unwrap(currency1)).approve(address(hook), type(uint256).max);
    }

    function test_InitialPricing() public {
        uint256 totalLiquidity = 10000e18;
        hook.addInitialLiquidity(key, totalLiquidity);
        
        (uint256 yesPrice, uint256 noPrice) = hook.getPrice(key);
        
        assertEq(yesPrice, 0.8e18, "YES price should be 80%");
        assertEq(noPrice, 0.2e18, "NO price should be 20%");
        
        assertEq(yesPrice + noPrice, 1e18, "Prices should sum to 100%");
    }
    
    function test_SwapMaintainsConstantSum() public {
        uint256 totalLiquidity = 10000e18;
        hook.addInitialLiquidity(key, totalLiquidity);
        
        uint256 swapAmount = 1000e18;
        bool zeroForOne = true;
        
        swap(key, zeroForOne, -int256(swapAmount), "");
        
        uint256 yesReserve = hook.yesReserve(key.toId());
        uint256 noReserve = hook.noReserve(key.toId());
        
        assertEq(yesReserve + noReserve, totalLiquidity, "Sum should remain constant");
        
        (uint256 yesPrice, uint256 noPrice) = hook.getPrice(key);
        assertGt(yesPrice, 0.8e18, "YES price should increase after buying YES");
        assertLt(noPrice, 0.2e18, "NO price should decrease after buying YES");
    }
    
    function test_PricesSumToOne() public {
        uint256 totalLiquidity = 10000e18;
        hook.addInitialLiquidity(key, totalLiquidity);
        
        for (uint i = 0; i < 5; i++) {
            uint256 swapAmount = 500e18;
            bool zeroForOne = i % 2 == 0;
            
            swap(key, zeroForOne, -int256(swapAmount), "");
            
            (uint256 yesPrice, uint256 noPrice) = hook.getPrice(key);
            assertEq(yesPrice + noPrice, 1e18, "Prices should always sum to 100%");
        }
    }
}