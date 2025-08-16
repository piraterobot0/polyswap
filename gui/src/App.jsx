import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import PredictionMarket from './components/PredictionMarket';
import SwapV2 from './components/SwapV2';
import SimpleLogo from './components/SimpleLogo';
import LogoPage from './components/LogoPage';
import LiquidityCurve from './components/LiquidityCurve';

function App() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('positions');

  return (
    <div className="min-h-screen bg-black">
      <nav className="border-b border-zinc-800 bg-black/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <SimpleLogo size={40} />
                <h1 className="text-2xl font-bold text-orange-500">
                  PolySwap Markets
                </h1>
              </div>
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
                  <button
                    onClick={() => setActiveTab('logo')}
                    className={`px-4 py-2 rounded-md font-medium transition-all ${
                      activeTab === 'logo'
                        ? 'bg-zinc-800 text-orange-500 shadow-sm'
                        : 'text-gray-400 hover:text-orange-400'
                    }`}
                  >
                    Logo
                  </button>
                  <button
                    onClick={() => setActiveTab('curve')}
                    className={`px-4 py-2 rounded-md font-medium transition-all ${
                      activeTab === 'curve'
                        ? 'bg-zinc-800 text-orange-500 shadow-sm'
                        : 'text-gray-400 hover:text-orange-400'
                    }`}
                  >
                    Curve
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
          activeTab === 'positions' ? <PredictionMarket /> : 
          activeTab === 'swap' ? <SwapV2 /> : 
          activeTab === 'logo' ? <LogoPage /> :
          <LiquidityCurve />
        ) : (
          <div className="text-center py-20">
            <div className="mb-8">
              <SimpleLogo size={120} />
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