import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { useState, useEffect } from 'react';
import { ERC20_ABI } from '../config/contracts';

const PredictionMarket = () => {
  const { address } = useAccount();
  const [yesBalance, setYesBalance] = useState('0');
  const [noBalance, setNoBalance] = useState('0');

  // Market configuration
  const market = {
    question: "Will Google have the best AI model by the end of September 2025?",
    erc1155Contract: "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045", // Polymarket CTF Exchange
    yesTokenId: "65880048952541620153230365826580171049439578129923156747663728476967119230732",
    noTokenId: "106277356443369138797049499065953438334187241175412976556484145976288075138631",
    yesToken: {
      address: "0x91BdE82669D279B37a5F4Fe44c0D4b06054577B1", // Deterministic wrapper address
      symbol: "wPOSI-YES",
      decimals: 18
    },
    noToken: {
      address: "0xcDb79f7f9D387cd034e87abAc34e222F146fc3C5", // Already wrapped NO token
      symbol: "wPOSI-NO", 
      decimals: 18
    }
  };

  // Fetch YES token balance
  const { data: yesTokenBalance } = useReadContract({
    address: market.yesToken.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
  });

  // Fetch NO token balance
  const { data: noTokenBalance } = useReadContract({
    address: market.noToken.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
  });

  useEffect(() => {
    if (yesTokenBalance) {
      // Convert from wei to human-readable format
      // Since 1 ERC-1155 = 1 wei in ERC-20, we multiply by 10^12 for display
      const rawBalance = BigInt(yesTokenBalance);
      const scaledBalance = rawBalance * BigInt(10 ** 12); // Scale up for display
      setYesBalance(formatUnits(scaledBalance, 18));
    }
  }, [yesTokenBalance]);

  useEffect(() => {
    if (noTokenBalance) {
      // Convert from wei to human-readable format
      const rawBalance = BigInt(noTokenBalance);
      const scaledBalance = rawBalance * BigInt(10 ** 12); // Scale up for display
      setNoBalance(formatUnits(scaledBalance, 18));
    }
  }, [noTokenBalance]);

  // Calculate total position value (assuming 1 share = 1 unit for now)
  const totalShares = parseFloat(yesBalance) + parseFloat(noBalance);
  
  // Calculate implied probabilities based on holdings
  const yesPercentage = totalShares > 0 ? (parseFloat(yesBalance) / totalShares * 100).toFixed(1) : '0';
  const noPercentage = totalShares > 0 ? (parseFloat(noBalance) / totalShares * 100).toFixed(1) : '0';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Market Question Header */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 mb-6">
        <h2 className="text-2xl font-bold text-orange-500 mb-2">Prediction Market</h2>
        <p className="text-lg text-gray-300">{market.question}</p>
        <div className="mt-4 flex items-center gap-2">
          <span className="px-3 py-1 bg-zinc-800 text-orange-400 rounded-full text-sm font-medium">
            AI & Technology
          </span>
          <span className="px-3 py-1 bg-zinc-800 text-gray-400 rounded-full text-sm font-medium">
            Expires: September 30, 2025
          </span>
        </div>
      </div>

      {/* Position Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* YES Position */}
        <div className="bg-zinc-900 rounded-xl p-6 border border-green-900/50">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-green-800">YES</h3>
              <p className="text-sm text-green-600 mt-1">Google will lead</p>
            </div>
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              {yesPercentage}%
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">Your Position</p>
              <p className="text-2xl font-bold text-gray-100">
                {parseFloat(yesBalance).toLocaleString(undefined, { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6 
                })}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {market.yesToken.symbol} shares
              </p>
            </div>
            
            {market.yesToken.address !== "0x0000000000000000000000000000000000000000" && (
              <div className="pt-3 border-t border-green-900/30">
                <p className="text-xs text-gray-500 break-all">
                  Token: {market.yesToken.address}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* NO Position */}
        <div className="bg-zinc-900 rounded-xl p-6 border border-red-900/50">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-red-800">NO</h3>
              <p className="text-sm text-red-600 mt-1">Others will lead</p>
            </div>
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              {noPercentage}%
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">Your Position</p>
              <p className="text-2xl font-bold text-gray-100">
                {parseFloat(noBalance).toLocaleString(undefined, { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6 
                })}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {market.noToken.symbol} shares
              </p>
            </div>
            
            <div className="pt-3 border-t border-red-900/30">
              <p className="text-xs text-gray-500 break-all">
                Token: {market.noToken.address}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <h3 className="text-lg font-semibold text-orange-500 mb-4">Portfolio Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-400">Total Shares</p>
            <p className="text-xl font-bold text-gray-100">
              {totalShares.toLocaleString(undefined, { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Position Ratio</p>
            <p className="text-xl font-bold text-gray-100">
              {yesPercentage}/{noPercentage}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Market Status</p>
            <p className="text-xl font-bold text-green-500">Active</p>
          </div>
        </div>

        {/* Position Bar */}
        {totalShares > 0 && (
          <div className="mt-6">
            <p className="text-sm text-gray-400 mb-2">Position Distribution</p>
            <div className="h-8 bg-zinc-800 rounded-full overflow-hidden flex">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center text-white text-sm font-bold"
                style={{ width: `${yesPercentage}%` }}
              >
                {parseFloat(yesPercentage) > 10 && 'YES'}
              </div>
              <div 
                className="bg-gradient-to-r from-red-400 to-red-500 flex items-center justify-center text-white text-sm font-bold"
                style={{ width: `${noPercentage}%` }}
              >
                {parseFloat(noPercentage) > 10 && 'NO'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-orange-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-gray-300">
            <p className="font-semibold mb-1 text-orange-400">About Your Positions</p>
            <p>These tokens represent your prediction on whether Google will have the best AI model by September 2025. 
               Each position is backed by wrapped ERC-1155 tokens that can be unwrapped at any time.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionMarket;