import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { ERC20_ABI } from '../config/contracts';
import { UNISWAP_V3_CONFIG } from '../config/uniswapConfig';
import { 
  usePoolInfo, 
  useSwapQuote, 
  useUniswapV3Swap,
  calculatePriceImpact 
} from '../hooks/useUniswapV3';

const UniswapSwap = () => {
  const { address, isConnected } = useAccount();
  const [fromToken, setFromToken] = useState('YES');
  const [toToken, setToToken] = useState('NO');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  
  const poolInfo = usePoolInfo();
  const { executeSwap, isPending, isConfirming, isSuccess, error } = useUniswapV3Swap();

  // Token configuration
  const tokens = {
    YES: {
      address: UNISWAP_V3_CONFIG.YES_TOKEN,
      symbol: "wPOSI-YES",
      decimals: 18,
      color: "green"
    },
    NO: {
      address: UNISWAP_V3_CONFIG.NO_TOKEN,
      symbol: "wPOSI-NO",
      decimals: 18,
      color: "red"
    }
  };

  // Get token balances
  const { data: yesBalance } = useReadContract({
    address: tokens.YES.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
  });

  const { data: noBalance } = useReadContract({
    address: tokens.NO.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
  });

  // Parse amount for quote
  const amountIn = amount ? parseUnits(amount, tokens[fromToken].decimals) : 0n;
  
  // Get swap quote
  const { quote } = useSwapQuote(
    tokens[fromToken].address,
    tokens[toToken].address,
    amountIn
  );

  // Format balance for display
  const formatBalance = (balance) => {
    if (!balance) return '0.00';
    const rawBalance = BigInt(balance);
    const scaledBalance = rawBalance * BigInt(10 ** 12);
    return formatUnits(scaledBalance, 18);
  };

  // Get balance for current token
  const getBalance = (token) => {
    if (token === 'YES') {
      return yesBalance ? formatBalance(yesBalance) : '0.00';
    } else {
      return noBalance ? formatBalance(noBalance) : '0.00';
    }
  };

  // Handle token swap direction
  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount('');
  };

  // Calculate output with slippage
  const calculateOutput = () => {
    if (!quote || !quote.amountOut) return '0.00';
    return formatUnits(quote.amountOut, tokens[toToken].decimals);
  };

  // Calculate minimum output with slippage
  const calculateMinimumOutput = () => {
    if (!quote || !quote.amountOut) return 0n;
    const slippageMultiplier = BigInt(Math.floor((1 - parseFloat(slippage) / 100) * 10000));
    return (quote.amountOut * slippageMultiplier) / 10000n;
  };

  // Calculate price impact
  const getPriceImpact = () => {
    if (!quote || !amountIn || !poolInfo.price0) return 0;
    
    const currentPrice = fromToken === 'YES' ? poolInfo.price0 : poolInfo.price1;
    return calculatePriceImpact(amountIn, quote.amountOut, currentPrice);
  };

  // Handle swap execution
  const handleSwap = async () => {
    if (!amount || parseFloat(amount) === 0 || !quote) return;

    const minOutput = calculateMinimumOutput();
    
    await executeSwap(
      tokens[fromToken].address,
      tokens[toToken].address,
      amountIn,
      minOutput
    );
  };

  // Handle max button
  const handleMax = () => {
    const balance = getBalance(fromToken);
    setAmount(balance);
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 text-center">
          <h3 className="text-xl font-bold text-orange-500 mb-2">Connect Wallet</h3>
          <p className="text-gray-400">Connect your wallet to start swapping on Uniswap V3</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-orange-500">Uniswap V3 Swap</h2>
          <div className="flex items-center gap-2">
            {poolInfo.poolAddress && (
              <div className="px-2 py-1 bg-green-900/30 border border-green-800 rounded text-green-400 text-xs">
                Pool Active
              </div>
            )}
          </div>
        </div>

        {/* Pool Info */}
        {poolInfo.poolAddress && (
          <div className="bg-zinc-800 rounded-lg p-3 mb-4 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Pool Liquidity:</span>
              <span className="text-gray-200">{poolInfo.liquidity?.toString() || '0'}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Current Tick:</span>
              <span className="text-gray-200">{poolInfo.tick?.toString() || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">YES/NO Price:</span>
              <span className="text-gray-200">
                {poolInfo.price0 ? poolInfo.price0.toFixed(4) : '0'}
              </span>
            </div>
          </div>
        )}

        {/* From Token */}
        <div className="bg-zinc-800 rounded-xl p-4 mb-2">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-400">From</span>
            <span className="text-sm text-gray-400">
              Balance: {getBalance(fromToken)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setFromToken(fromToken === 'YES' ? 'NO' : 'YES');
                setToToken(toToken === 'YES' ? 'NO' : 'YES');
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border ${
                tokens[fromToken].color === 'green' ? 'border-green-500' : 'border-red-500'
              } hover:bg-zinc-700 transition-colors`}
            >
              <div className={`w-6 h-6 rounded-full ${
                tokens[fromToken].color === 'green' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="font-semibold text-white">{fromToken}</span>
            </button>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 text-right text-2xl font-semibold bg-transparent outline-none text-white"
            />
          </div>
          <div className="flex justify-end mt-2">
            <button
              onClick={handleMax}
              className="text-sm text-orange-500 hover:text-orange-400 font-medium"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={handleSwapTokens}
            className="bg-zinc-900 border-4 border-zinc-900 rounded-xl p-2 hover:bg-zinc-800 transition-colors shadow-md"
          >
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* To Token */}
        <div className="bg-zinc-800 rounded-xl p-4 mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-400">To</span>
            <span className="text-sm text-gray-400">
              Balance: {getBalance(toToken)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border ${
              tokens[toToken].color === 'green' ? 'border-green-500' : 'border-red-500'
            }`}>
              <div className={`w-6 h-6 rounded-full ${
                tokens[toToken].color === 'green' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="font-semibold text-white">{toToken}</span>
            </div>
            <input
              type="text"
              value={calculateOutput()}
              readOnly
              placeholder="0.00"
              className="flex-1 text-right text-2xl font-semibold bg-transparent outline-none text-gray-400"
            />
          </div>
        </div>

        {/* Price Info */}
        {quote && amount && parseFloat(amount) > 0 && (
          <div className="bg-zinc-800 rounded-lg p-3 mb-4 border border-zinc-700">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Rate</span>
              <span className="font-medium text-gray-200">
                1 {fromToken} = {(Number(quote.amountOut) / Number(amountIn)).toFixed(4)} {toToken}
              </span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Price Impact</span>
              <span className={`font-medium ${
                getPriceImpact() > 5 ? 'text-red-400' : 'text-gray-200'
              }`}>
                {getPriceImpact().toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Slippage Tolerance</span>
              <span className="font-medium text-gray-200">{slippage}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Minimum Received</span>
              <span className="font-medium text-gray-200">
                {formatUnits(calculateMinimumOutput(), tokens[toToken].decimals)} {toToken}
              </span>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={
            !amount || 
            parseFloat(amount) === 0 || 
            parseFloat(amount) > parseFloat(getBalance(fromToken)) ||
            isPending ||
            isConfirming ||
            !quote
          }
          className={`w-full py-4 rounded-xl font-bold transition-all ${
            !amount || 
            parseFloat(amount) === 0 || 
            parseFloat(amount) > parseFloat(getBalance(fromToken)) ||
            isPending ||
            isConfirming ||
            !quote
              ? 'bg-zinc-700 text-gray-500 cursor-not-allowed'
              : 'bg-orange-500 text-black hover:bg-orange-400 transform hover:scale-[1.02]'
          }`}
        >
          {parseFloat(amount) > parseFloat(getBalance(fromToken))
            ? 'Insufficient Balance'
            : isPending || isConfirming
            ? 'Swapping...'
            : !amount || parseFloat(amount) === 0
            ? 'Enter Amount'
            : !quote
            ? 'Fetching Quote...'
            : 'Swap'}
        </button>

        {/* Transaction Status */}
        {error && (
          <div className="mt-4 p-3 bg-red-900/20 rounded-lg border border-red-900/50">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-400">
                {error?.message || 'Transaction failed'}
              </span>
            </div>
          </div>
        )}

        {/* Success State */}
        {isSuccess && (
          <div className="mt-4 p-3 bg-zinc-800 rounded-lg border border-green-900/50">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-green-400">
                Swap successful!
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Slippage Tolerance</span>
          <div className="flex gap-2">
            {['0.1', '0.5', '1.0'].map((value) => (
              <button
                key={value}
                onClick={() => setSlippage(value)}
                className={`px-2 py-1 rounded text-xs ${
                  slippage === value
                    ? 'bg-orange-900/30 border border-orange-500 text-orange-400'
                    : 'border border-zinc-700 hover:bg-zinc-800 text-gray-400'
                }`}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniswapSwap;