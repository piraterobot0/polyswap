import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { ERC20_ABI } from '../config/contracts';

const Swap = () => {
  const { address, isConnected } = useAccount();
  const [fromToken, setFromToken] = useState('YES');
  const [toToken, setToToken] = useState('NO');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');

  // Market configuration (same as PredictionMarket)
  const tokens = {
    YES: {
      address: "0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1",
      symbol: "wPOSI-YES",
      decimals: 18,
      color: "green"
    },
    NO: {
      address: "0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5",
      symbol: "wPOSI-NO",
      decimals: 18,
      color: "red"
    }
  };

  // Get balance for from token
  const { data: fromBalance } = useReadContract({
    address: tokens[fromToken].address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
  });

  // Get balance for to token
  const { data: toBalance } = useReadContract({
    address: tokens[toToken].address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
  });

  // Write contract hooks for approval and swap
  const { writeContract: approve, data: approveHash } = useWriteContract();
  const { writeContract: swap, data: swapHash } = useWriteContract();

  // Wait for transaction receipts
  const { isLoading: isApproving, isSuccess: isApproved } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isSwapping, isSuccess: isSwapped } = useWaitForTransactionReceipt({
    hash: swapHash,
  });

  // Format balances for display
  const formatBalance = (balance) => {
    if (!balance) return '0.00';
    const rawBalance = BigInt(balance);
    const scaledBalance = rawBalance * BigInt(10 ** 12);
    return formatUnits(scaledBalance, 18);
  };

  // Handle token swap
  const handleSwap = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount('');
  };

  // Calculate output amount (1:1 for now, in reality would use AMM formula)
  const calculateOutput = () => {
    if (!amount || parseFloat(amount) === 0) return '0.00';
    // Simple 1:1 swap with slippage for demo
    const slippageMultiplier = 1 - (parseFloat(slippage) / 100);
    return (parseFloat(amount) * slippageMultiplier).toFixed(6);
  };

  // Handle max button
  const handleMax = () => {
    const balance = formatBalance(fromBalance);
    setAmount(balance);
  };

  // Handle swap execution
  const executeSwap = async () => {
    if (!amount || parseFloat(amount) === 0) return;
    
    // In a real implementation, this would interact with a DEX contract
    // For now, we'll show the UI flow
    console.log('Executing swap:', {
      from: fromToken,
      to: toToken,
      amount: amount,
      expectedOutput: calculateOutput()
    });

    // Example: First approve tokens
    // await approve({
    //   address: tokens[fromToken].address,
    //   abi: ERC20_ABI,
    //   functionName: 'approve',
    //   args: [DEX_CONTRACT_ADDRESS, parseUnits(amount, 18)]
    // });

    // Then execute swap
    // await swap({
    //   address: DEX_CONTRACT_ADDRESS,
    //   abi: DEX_ABI,
    //   functionName: 'swap',
    //   args: [...]
    // });
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Connect Wallet</h3>
          <p className="text-gray-600">Connect your wallet to start swapping tokens</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Swap</h2>
          <button
            onClick={() => document.getElementById('settings-modal').showModal()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* From Token */}
        <div className="bg-gray-50 rounded-xl p-4 mb-2">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">From</span>
            <span className="text-sm text-gray-600">
              Balance: {formatBalance(fromBalance)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white border ${
                fromToken === 'YES' ? 'border-green-500' : 'border-red-500'
              } hover:bg-gray-50 transition-colors`}
            >
              <div className={`w-6 h-6 rounded-full ${
                fromToken === 'YES' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="font-semibold">{fromToken}</span>
            </button>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 text-right text-2xl font-semibold bg-transparent outline-none"
            />
          </div>
          <div className="flex justify-end mt-2">
            <button
              onClick={handleMax}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={handleSwap}
            className="bg-white border-4 border-white rounded-xl p-2 hover:bg-gray-50 transition-colors shadow-md"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* To Token */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">To</span>
            <span className="text-sm text-gray-600">
              Balance: {formatBalance(toBalance)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white border ${
                toToken === 'YES' ? 'border-green-500' : 'border-red-500'
              } hover:bg-gray-50 transition-colors`}
            >
              <div className={`w-6 h-6 rounded-full ${
                toToken === 'YES' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="font-semibold">{toToken}</span>
            </button>
            <input
              type="text"
              value={calculateOutput()}
              readOnly
              placeholder="0.00"
              className="flex-1 text-right text-2xl font-semibold bg-transparent outline-none text-gray-500"
            />
          </div>
        </div>

        {/* Price Info */}
        {amount && parseFloat(amount) > 0 && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Rate</span>
              <span className="font-medium">1 {fromToken} = {(1 - parseFloat(slippage) / 100).toFixed(3)} {toToken}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Slippage Tolerance</span>
              <span className="font-medium">{slippage}%</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Minimum Received</span>
              <span className="font-medium">{calculateOutput()} {toToken}</span>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={executeSwap}
          disabled={!amount || parseFloat(amount) === 0 || parseFloat(amount) > parseFloat(formatBalance(fromBalance))}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
            !amount || parseFloat(amount) === 0 || parseFloat(amount) > parseFloat(formatBalance(fromBalance))
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transform hover:scale-[1.02]'
          }`}
        >
          {parseFloat(amount) > parseFloat(formatBalance(fromBalance))
            ? 'Insufficient Balance'
            : !amount || parseFloat(amount) === 0
            ? 'Enter Amount'
            : 'Swap'}
        </button>

        {/* Loading States */}
        {(isApproving || isSwapping) && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-yellow-800">
                {isApproving ? 'Approving tokens...' : 'Swapping tokens...'}
              </span>
            </div>
          </div>
        )}

        {/* Success State */}
        {isSwapped && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-green-800">Swap successful!</span>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <dialog id="settings-modal" className="p-0 rounded-2xl backdrop:bg-black/50">
        <div className="bg-white rounded-2xl p-6 w-96">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Transaction Settings</h3>
            <button
              onClick={() => document.getElementById('settings-modal').close()}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slippage Tolerance
              </label>
              <div className="flex gap-2">
                {['0.1', '0.5', '1.0'].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={`px-3 py-1 rounded-lg border ${
                      slippage === value
                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
                <input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded-lg"
                  placeholder="Custom"
                />
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <button
                onClick={() => document.getElementById('settings-modal').close()}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </dialog>

      {/* Info Box */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">Demo Mode</p>
            <p>This is a UI demonstration. To enable actual swapping, integrate with a DEX contract or liquidity pool.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Swap;