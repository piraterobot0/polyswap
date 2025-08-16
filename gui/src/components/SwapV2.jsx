import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { parseUnits, formatUnits, parseEther, formatEther } from 'viem';
import { ERC20_ABI, POL_TOKEN } from '../config/contracts';

const SwapV2 = () => {
  const { address, isConnected } = useAccount();
  const [fromToken, setFromToken] = useState('POL');
  const [toToken, setToToken] = useState('YES');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [showTokenSelect, setShowTokenSelect] = useState(null);
  const [needsApproval, setNeedsApproval] = useState(false);

  // Token configuration with POL added
  const tokens = {
    POL: {
      address: POL_TOKEN.address,
      symbol: "POL",
      decimals: 18,
      color: "purple",
      isNative: true
    },
    YES: {
      address: "0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1",
      symbol: "wPOSI-YES",
      decimals: 18,
      color: "green",
      isNative: false
    },
    NO: {
      address: "0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5",
      symbol: "wPOSI-NO",
      decimals: 18,
      color: "red",
      isNative: false
    }
  };

  // Get POL balance (native token)
  const { data: polBalance } = useBalance({
    address: address,
    watch: true,
  });

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

  // Check allowance for the from token (if not POL)
  const { data: allowance } = useReadContract({
    address: tokens[fromToken]?.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address, address], // Using sender address as router for demo
    enabled: fromToken !== 'POL' && !!address,
    watch: true,
  });

  // Contract write hooks
  const { 
    writeContract: approve, 
    data: approveHash,
    isPending: isApproving,
    error: approveError 
  } = useWriteContract();
  
  const { 
    writeContract: swap, 
    data: swapHash,
    isPending: isSwapping,
    error: swapError
  } = useWriteContract();

  // Wait for transaction receipts
  const { isLoading: isApproveTxPending, isSuccess: isApproved } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isSwapTxPending, isSuccess: isSwapped } = useWaitForTransactionReceipt({
    hash: swapHash,
  });

  // Get balance for current token
  const getBalance = (token) => {
    if (token === 'POL') {
      return polBalance ? formatEther(polBalance.value) : '0.00';
    } else if (token === 'YES') {
      return yesBalance ? formatBalance(yesBalance) : '0.00';
    } else if (token === 'NO') {
      return noBalance ? formatBalance(noBalance) : '0.00';
    }
    return '0.00';
  };

  // Format balance for display
  const formatBalance = (balance) => {
    if (!balance) return '0.00';
    const rawBalance = BigInt(balance);
    const scaledBalance = rawBalance * BigInt(10 ** 12);
    return formatUnits(scaledBalance, 18);
  };

  // Check if approval is needed
  useEffect(() => {
    if (fromToken === 'POL' || !amount || parseFloat(amount) === 0) {
      setNeedsApproval(false);
      return;
    }

    const amountWei = parseUnits(amount || '0', tokens[fromToken].decimals);
    setNeedsApproval(allowance ? BigInt(allowance) < amountWei : true);
  }, [fromToken, amount, allowance]);

  // Handle token swap direction
  const handleSwap = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount('');
  };

  // Calculate output amount (simple 1:1 for demo, would use AMM formula in production)
  const calculateOutput = () => {
    if (!amount || parseFloat(amount) === 0) return '0.00';
    // Simple calculation with slippage
    const slippageMultiplier = 1 - (parseFloat(slippage) / 100);
    return (parseFloat(amount) * slippageMultiplier).toFixed(6);
  };

  // Handle max button
  const handleMax = () => {
    const balance = getBalance(fromToken);
    // Leave some POL for gas if selecting max POL
    if (fromToken === 'POL' && balance) {
      const maxPol = Math.max(0, parseFloat(balance) - 0.1);
      setAmount(maxPol.toString());
    } else {
      setAmount(balance);
    }
  };

  // Handle approval
  const handleApprove = async () => {
    if (!amount || fromToken === 'POL') return;

    const amountToApprove = parseUnits(amount, tokens[fromToken].decimals);
    
    try {
      await approve({
        address: tokens[fromToken].address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [address, amountToApprove], // Using sender address as router for demo
      });
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  // Handle swap execution
  const executeSwap = async () => {
    if (!amount || parseFloat(amount) === 0) return;

    try {
      const amountIn = fromToken === 'POL' 
        ? parseEther(amount)
        : parseUnits(amount, tokens[fromToken].decimals);

      if (fromToken === 'POL') {
        // POL to Token swap (would send POL value in real implementation)
        await swap({
          address: tokens[toToken].address,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [address, amountIn],
          value: amountIn, // Send POL with transaction
        });
      } else if (toToken === 'POL') {
        // Token to POL swap
        await swap({
          address: tokens[fromToken].address,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [address, amountIn],
        });
      } else {
        // Token to Token swap
        await swap({
          address: tokens[fromToken].address,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [tokens[toToken].address, amountIn],
        });
      }
    } catch (error) {
      console.error('Swap failed:', error);
    }
  };

  // Token selector component
  const TokenSelector = ({ isFrom }) => {
    const currentToken = isFrom ? fromToken : toToken;
    const setToken = isFrom ? setFromToken : setToToken;
    const otherToken = isFrom ? toToken : fromToken;

    return (
      <div className="absolute top-full mt-2 bg-zinc-900 border border-zinc-800 rounded-xl p-2 w-48 z-50">
        {Object.entries(tokens).map(([key, token]) => (
          <button
            key={key}
            onClick={() => {
              if (key !== otherToken) {
                setToken(key);
                setShowTokenSelect(null);
              }
            }}
            disabled={key === otherToken}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              key === currentToken 
                ? 'bg-zinc-800' 
                : key === otherToken
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-zinc-800'
            }`}
          >
            <div className={`w-6 h-6 rounded-full ${
              token.color === 'purple' ? 'bg-purple-500' :
              token.color === 'green' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <div className="text-left">
              <div className="font-semibold text-white">{key}</div>
              <div className="text-xs text-gray-400">{token.symbol}</div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-600 to-orange-500 mb-4">
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-orange-500 mb-2">Connect Wallet</h3>
          <p className="text-gray-400">Connect your wallet to start swapping tokens</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-orange-500">Swap</h2>
          <button
            onClick={() => document.getElementById('settings-modal').showModal()}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* From Token */}
        <div className="bg-zinc-800 rounded-xl p-4 mb-2">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-400">From</span>
            <span className="text-sm text-gray-400">
              Balance: {getBalance(fromToken)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowTokenSelect(showTokenSelect === 'from' ? null : 'from')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border ${
                  tokens[fromToken].color === 'purple' ? 'border-purple-500' :
                  tokens[fromToken].color === 'green' ? 'border-green-500' : 'border-red-500'
                } hover:bg-zinc-700 transition-colors`}
              >
                <div className={`w-6 h-6 rounded-full ${
                  tokens[fromToken].color === 'purple' ? 'bg-purple-500' :
                  tokens[fromToken].color === 'green' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="font-semibold text-white">{fromToken}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showTokenSelect === 'from' && <TokenSelector isFrom={true} />}
            </div>
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
            onClick={handleSwap}
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
            <div className="relative">
              <button
                onClick={() => setShowTokenSelect(showTokenSelect === 'to' ? null : 'to')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border ${
                  tokens[toToken].color === 'purple' ? 'border-purple-500' :
                  tokens[toToken].color === 'green' ? 'border-green-500' : 'border-red-500'
                } hover:bg-zinc-700 transition-colors`}
              >
                <div className={`w-6 h-6 rounded-full ${
                  tokens[toToken].color === 'purple' ? 'bg-purple-500' :
                  tokens[toToken].color === 'green' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="font-semibold text-white">{toToken}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showTokenSelect === 'to' && <TokenSelector isFrom={false} />}
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
        {amount && parseFloat(amount) > 0 && (
          <div className="bg-zinc-800 rounded-lg p-3 mb-4 border border-zinc-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Rate</span>
              <span className="font-medium text-gray-200">
                1 {fromToken} = {(1 - parseFloat(slippage) / 100).toFixed(3)} {toToken}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">Slippage Tolerance</span>
              <span className="font-medium text-gray-200">{slippage}%</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">Minimum Received</span>
              <span className="font-medium text-gray-200">{calculateOutput()} {toToken}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {needsApproval && fromToken !== 'POL' ? (
          <button
            onClick={handleApprove}
            disabled={isApproving || isApproveTxPending || !amount || parseFloat(amount) === 0}
            className={`w-full py-4 rounded-xl font-bold transition-all ${
              isApproving || isApproveTxPending || !amount || parseFloat(amount) === 0
                ? 'bg-zinc-700 text-gray-500 cursor-not-allowed'
                : 'bg-orange-500 text-black hover:bg-orange-400 transform hover:scale-[1.02]'
            }`}
          >
            {isApproving || isApproveTxPending ? 'Approving...' : `Approve ${fromToken}`}
          </button>
        ) : (
          <button
            onClick={executeSwap}
            disabled={
              !amount || 
              parseFloat(amount) === 0 || 
              parseFloat(amount) > parseFloat(getBalance(fromToken)) ||
              isSwapping ||
              isSwapTxPending
            }
            className={`w-full py-4 rounded-xl font-bold transition-all ${
              !amount || 
              parseFloat(amount) === 0 || 
              parseFloat(amount) > parseFloat(getBalance(fromToken)) ||
              isSwapping ||
              isSwapTxPending
                ? 'bg-zinc-700 text-gray-500 cursor-not-allowed'
                : 'bg-orange-500 text-black hover:bg-orange-400 transform hover:scale-[1.02]'
            }`}
          >
            {parseFloat(amount) > parseFloat(getBalance(fromToken))
              ? 'Insufficient Balance'
              : isSwapping || isSwapTxPending
              ? 'Swapping...'
              : !amount || parseFloat(amount) === 0
              ? 'Enter Amount'
              : 'Swap'}
          </button>
        )}

        {/* Transaction Status */}
        {(approveError || swapError) && (
          <div className="mt-4 p-3 bg-red-900/20 rounded-lg border border-red-900/50">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-400">
                {approveError?.message || swapError?.message || 'Transaction failed'}
              </span>
            </div>
          </div>
        )}

        {/* Success State */}
        {(isApproved || isSwapped) && (
          <div className="mt-4 p-3 bg-zinc-800 rounded-lg border border-green-900/50">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-green-400">
                {isApproved && !isSwapped ? 'Approval successful!' : 'Swap successful!'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <dialog id="settings-modal" className="p-0 rounded-2xl backdrop:bg-black/80">
        <div className="bg-zinc-900 rounded-2xl p-6 w-96 border border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-orange-500">Transaction Settings</h3>
            <button
              onClick={() => document.getElementById('settings-modal').close()}
              className="p-1 hover:bg-zinc-800 rounded-lg"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Slippage Tolerance
              </label>
              <div className="flex gap-2">
                {['0.1', '0.5', '1.0'].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={`px-3 py-1 rounded-lg border ${
                      slippage === value
                        ? 'bg-orange-900/30 border-orange-500 text-orange-400'
                        : 'border-zinc-700 hover:bg-zinc-800 text-gray-400'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
                <input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="flex-1 px-3 py-1 border border-zinc-700 bg-zinc-800 text-white rounded-lg"
                  placeholder="Custom"
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-zinc-800">
              <button
                onClick={() => document.getElementById('settings-modal').close()}
                className="w-full py-2 bg-orange-500 text-black font-semibold rounded-lg hover:bg-orange-400 transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </dialog>

      {/* Info Box */}
      <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-orange-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-gray-300">
            <p className="font-semibold mb-1 text-orange-400">Direct P2P Swaps</p>
            <p>Swap POL, YES, and NO tokens directly. Note: Without liquidity pools, swaps are executed as direct transfers. Add liquidity to enable AMM-based pricing.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapV2;