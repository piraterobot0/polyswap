import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { HOOK_ABI } from '../config/hookAbi';
import { HOOK_ADDRESS, POOL_KEY } from '../config/contractAddresses';

export const useHookPoolInfo = () => {
  const { data, isLoading, error, refetch } = useReadContract({
    address: HOOK_ADDRESS,
    abi: HOOK_ABI,
    functionName: 'getPoolInfo',
    args: [POOL_KEY],
    watch: true,
  });

  if (data) {
    const [liquidity, r0, r1, price0, price1] = data;
    return {
      totalLiquidity: liquidity,
      reserve0: r0,
      reserve1: r1,
      price0: price0,  // This is already a percentage (0-100)
      price1: price1,  // This is already a percentage (0-100)
      isLoading,
      error,
      refetch
    };
  }

  return {
    totalLiquidity: 0n,
    reserve0: 0n,
    reserve1: 0n,
    price0: 0n,
    price1: 0n,
    isLoading,
    error,
    refetch
  };
};

export const useAddLiquidity = () => {
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

  const addLiquidity = async (amount0, amount1) => {
    try {
      await writeContract({
        address: HOOK_ADDRESS,
        abi: HOOK_ABI,
        functionName: 'addLiquidity',
        args: [POOL_KEY, amount0, amount1],
      });
    } catch (err) {
      console.error('Add liquidity failed:', err);
    }
  };

  const addAvailableLiquidity = async () => {
    try {
      await writeContract({
        address: HOOK_ADDRESS,
        abi: HOOK_ABI,
        functionName: 'addAvailableLiquidity',
        args: [POOL_KEY],
      });
    } catch (err) {
      console.error('Add available liquidity failed:', err);
    }
  };

  return {
    addLiquidity,
    addAvailableLiquidity,
    isPending,
    isConfirming,
    isSuccess,
    error,
    txHash
  };
};

// Calculate swap output based on constant sum formula
export const calculateSwapOutput = (amountIn, reserve0, reserve1, zeroForOne) => {
  if (!amountIn || amountIn === 0n) return 0n;
  
  // Constant sum AMM: 1:1 exchange
  // But limited by available reserves
  const inputReserve = zeroForOne ? reserve0 : reserve1;
  const outputReserve = zeroForOne ? reserve1 : reserve0;
  
  // Can't swap more than what's available in output reserve
  const maxOutput = outputReserve;
  const output = amountIn > maxOutput ? maxOutput : amountIn;
  
  return output;
};

// Format price as percentage
export const formatPrice = (price) => {
  if (!price || price === 0n) return '0';
  return price.toString();
};