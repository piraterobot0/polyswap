import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { 
  UNISWAP_V3_CONFIG, 
  FACTORY_ABI, 
  UNISWAP_V3_POOL_ABI,
  SWAP_ROUTER_ABI,
  QUOTER_V2_ABI 
} from '../config/uniswapConfig';
import { ERC20_ABI } from '../config/contracts';
import { useState, useEffect } from 'react';

// Get the pool address
export const useUniswapV3Pool = () => {
  const { data: poolAddress } = useReadContract({
    address: UNISWAP_V3_CONFIG.FACTORY,
    abi: FACTORY_ABI,
    functionName: 'getPool',
    args: [
      UNISWAP_V3_CONFIG.YES_TOKEN,
      UNISWAP_V3_CONFIG.NO_TOKEN,
      UNISWAP_V3_CONFIG.POOL_FEE
    ],
  });

  return poolAddress;
};

// Get pool information
export const usePoolInfo = () => {
  const poolAddress = useUniswapV3Pool();
  
  // Get slot0 data (price, tick, etc.)
  const { data: slot0 } = useReadContract({
    address: poolAddress,
    abi: UNISWAP_V3_POOL_ABI,
    functionName: 'slot0',
    enabled: !!poolAddress,
    watch: true,
  });

  // Get liquidity
  const { data: liquidity } = useReadContract({
    address: poolAddress,
    abi: UNISWAP_V3_POOL_ABI,
    functionName: 'liquidity',
    enabled: !!poolAddress,
    watch: true,
  });

  // Get token0
  const { data: token0 } = useReadContract({
    address: poolAddress,
    abi: UNISWAP_V3_POOL_ABI,
    functionName: 'token0',
    enabled: !!poolAddress,
  });

  // Get token1
  const { data: token1 } = useReadContract({
    address: poolAddress,
    abi: UNISWAP_V3_POOL_ABI,
    functionName: 'token1',
    enabled: !!poolAddress,
  });

  // Calculate price from sqrtPriceX96
  let price0 = 0;
  let price1 = 0;
  
  if (slot0) {
    const sqrtPriceX96 = slot0[0];
    // Price = (sqrtPriceX96 / 2^96)^2
    const price = (Number(sqrtPriceX96) / (2 ** 96)) ** 2;
    
    // If YES is token0
    if (token0?.toLowerCase() === UNISWAP_V3_CONFIG.YES_TOKEN.toLowerCase()) {
      price1 = price;  // Price of NO in terms of YES
      price0 = 1 / price;  // Price of YES in terms of NO
    } else {
      price0 = price;  // Price of YES in terms of NO
      price1 = 1 / price;  // Price of NO in terms of YES
    }
  }

  return {
    poolAddress,
    liquidity,
    sqrtPriceX96: slot0?.[0],
    tick: slot0?.[1],
    token0,
    token1,
    price0,  // YES price
    price1,  // NO price
    isYesToken0: token0?.toLowerCase() === UNISWAP_V3_CONFIG.YES_TOKEN.toLowerCase()
  };
};

// Get quote for swap
export const useSwapQuote = (tokenIn, tokenOut, amountIn) => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { data: quoteData } = useReadContract({
    address: UNISWAP_V3_CONFIG.QUOTER_V2,
    abi: QUOTER_V2_ABI,
    functionName: 'quoteExactInputSingle',
    args: [{
      tokenIn: tokenIn,
      tokenOut: tokenOut,
      amountIn: amountIn || 0n,
      fee: UNISWAP_V3_CONFIG.POOL_FEE,
      sqrtPriceLimitX96: 0n
    }],
    enabled: !!tokenIn && !!tokenOut && !!amountIn && amountIn > 0n,
  });

  useEffect(() => {
    if (quoteData) {
      setQuote({
        amountOut: quoteData[0],
        sqrtPriceX96After: quoteData[1],
        initializedTicksCrossed: quoteData[2],
        gasEstimate: quoteData[3]
      });
    }
  }, [quoteData]);

  return { quote, loading };
};

// Execute swap
export const useUniswapV3Swap = () => {
  const { address } = useAccount();
  const { 
    writeContract, 
    data: txHash,
    isPending,
    error 
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess 
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const executeSwap = async (tokenIn, tokenOut, amountIn, amountOutMinimum) => {
    if (!address) return;
    
    try {
      // First approve the swap router
      await writeContract({
        address: tokenIn,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [UNISWAP_V3_CONFIG.SWAP_ROUTER, amountIn],
      });

      // Wait a bit for approval
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Execute the swap
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
      
      await writeContract({
        address: UNISWAP_V3_CONFIG.SWAP_ROUTER,
        abi: SWAP_ROUTER_ABI,
        functionName: 'exactInputSingle',
        args: [{
          tokenIn: tokenIn,
          tokenOut: tokenOut,
          fee: UNISWAP_V3_CONFIG.POOL_FEE,
          recipient: address,
          deadline: deadline,
          amountIn: amountIn,
          amountOutMinimum: amountOutMinimum,
          sqrtPriceLimitX96: 0n
        }],
      });
    } catch (err) {
      console.error('Swap failed:', err);
    }
  };

  return {
    executeSwap,
    isPending,
    isConfirming,
    isSuccess,
    error,
    txHash
  };
};

// Calculate price impact
export const calculatePriceImpact = (amountIn, amountOut, currentPrice) => {
  if (!amountIn || !amountOut || !currentPrice) return 0;
  
  const expectedOut = Number(amountIn) * currentPrice;
  const actualOut = Number(amountOut);
  
  const impact = ((expectedOut - actualOut) / expectedOut) * 100;
  return Math.abs(impact);
};