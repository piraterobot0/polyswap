import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import PredictionMarket from './components/PredictionMarket';
import SwapV2 from './components/SwapV2';

function App() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('positions');

  return (
    <div className="min-h-screen bg-black">
      <nav className="border-b border-zinc-800 bg-black/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-orange-500">
                PolySwap Markets
              </h1>
              {isConnected && (
                <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('positions')}
                    className={`px-4 py-2 rounded-md font-medium transition-all ${
                      activeTab === 'positions'
                        ? 'bg-zinc-800 text-orange-500 shadow-sm'
                        : 'text-gray-400 hover:text-orange-400'
                    }`}
                  >
                    Positions
                  </button>
                  <button
                    onClick={() => setActiveTab('swap')}
                    className={`px-4 py-2 rounded-md font-medium transition-all ${
                      activeTab === 'swap'
                        ? 'bg-zinc-800 text-orange-500 shadow-sm'
                        : 'text-gray-400 hover:text-orange-400'
                    }`}
                  >
                    Swap
                  </button>
                </div>
              )}
            </div>
            <ConnectButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isConnected ? (
          activeTab === 'positions' ? <PredictionMarket /> : <SwapV2 />
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-600 to-orange-500 mb-6">
              <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-orange-500 mb-4">
              Connect Your Wallet to Get Started
            </h2>
            <p className="text-lg text-gray-400 max-w-md mx-auto">
              Track your prediction market positions and swap tokens
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;