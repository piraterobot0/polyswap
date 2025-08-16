import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

const LiquidityCurve = () => {
  const { address } = useAccount();
  
  // Mock data for demonstration - in production this would come from smart contracts
  // Prices represent probability (0 to 1)
  const [yesPrice, setYesPrice] = useState(0.5); // 50% probability
  const [previousYesPrice, setPreviousYesPrice] = useState(0.45);
  const [reserves, setReserves] = useState({ yes: 5000, no: 5000 });
  const [lastTrade, setLastTrade] = useState({
    type: 'BUY_YES',
    amount: 100,
    timestamp: Date.now() - 300000, // 5 minutes ago
    priceChange: 0.05
  });

  // In a constant sum market: YES price + NO price = 1
  const noPrice = 1 - yesPrice;
  
  // For visualization, convert to percentage points on the graph
  const currentPoint = { x: yesPrice * 100, y: noPrice * 100 };
  const previousPoint = { x: previousYesPrice * 100, y: (1 - previousYesPrice) * 100 };
  
  // Calculate odds as percentages
  const yesOdds = yesPrice * 100;
  const noOdds = noPrice * 100;

  // Generate curve points for visualization - CONSTANT SUM is a straight line
  const generateCurvePoints = () => {
    // For constant sum where prices sum to 1: YES + NO = 1
    // This creates a straight line from (0,100) to (100,0)
    const points = [];
    
    // Generate points along the line where x + y = 100 (representing percentages)
    for (let x = 0; x <= 100; x += 1) {
      const y = 100 - x; // Since x% + y% = 100%
      points.push({ x, y });
    }
    return points;
  };

  const curvePoints = generateCurvePoints();

  // Create SVG path from points
  const createPath = (points) => {
    if (points.length === 0) return '';
    return points.reduce((path, point, index) => {
      const cmd = index === 0 ? 'M' : 'L';
      return `${path} ${cmd} ${point.x},${100 - point.y}`;
    }, '');
  };

  const curvePath = createPath(curvePoints);

  // Simulate curve movement for constant sum
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random trades
      const tradeType = Math.random() > 0.5 ? 'BUY_YES' : 'BUY_NO';
      const priceChange = (Math.random() * 0.1) - 0.05; // -5% to +5% change
      const tradeAmount = Math.floor(Math.random() * 200) + 50;
      
      setPreviousYesPrice(yesPrice);
      
      // Update price based on trade (keeping sum = 1)
      let newYesPrice;
      if (tradeType === 'BUY_YES') {
        // Buying YES increases YES price
        newYesPrice = Math.min(0.99, Math.max(0.01, yesPrice + priceChange));
        // Update reserves to reflect trade
        const newYes = reserves.yes - tradeAmount;
        const newNo = reserves.no + tradeAmount;
        setReserves({ yes: newYes, no: newNo });
      } else {
        // Buying NO decreases YES price
        newYesPrice = Math.min(0.99, Math.max(0.01, yesPrice - priceChange));
        const newYes = reserves.yes + tradeAmount;
        const newNo = reserves.no - tradeAmount;
        setReserves({ yes: newYes, no: newNo });
      }
      
      setYesPrice(newYesPrice);
      
      setLastTrade({
        type: tradeType,
        amount: tradeAmount,
        timestamp: Date.now(),
        priceChange: Math.abs(newYesPrice - yesPrice)
      });
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [yesPrice, reserves]);

  // Format time since last trade
  const timeSinceLastTrade = () => {
    const seconds = Math.floor((Date.now() - lastTrade.timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-orange-500 mb-2">Live Liquidity Curve</h2>
        <p className="text-gray-400">Real-time visualization of the AMM state and recent trades</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Curve Visualization */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
            <h3 className="text-lg font-semibold text-orange-400 mb-4">Constant Sum Curve (X+Y = k)</h3>
            
            <div className="relative bg-black rounded-xl p-4">
              <svg
                width="100%"
                height="400"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid meet"
                className="overflow-visible"
              >
                {/* Grid */}
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1a1a1a" strokeWidth="0.2" opacity="0.5"/>
                  </pattern>
                  
                  {/* Gradient for curve */}
                  <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#16a34a" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>

                  {/* Glow effect */}
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                <rect width="100" height="100" fill="url(#grid)" />
                
                {/* Axes */}
                <line x1="10" y1="90" x2="90" y2="90" stroke="#404040" strokeWidth="0.5" />
                <line x1="10" y1="10" x2="10" y2="90" stroke="#404040" strokeWidth="0.5" />
                
                {/* Axis labels */}
                <text x="95" y="92" fontSize="3" fill="#666" fontFamily="monospace">YES%</text>
                <text x="5" y="8" fontSize="3" fill="#666" fontFamily="monospace">NO%</text>
                
                {/* Axis values */}
                <text x="10" y="95" fontSize="2.5" fill="#404040" textAnchor="middle">0</text>
                <text x="50" y="95" fontSize="2.5" fill="#404040" textAnchor="middle">50</text>
                <text x="90" y="95" fontSize="2.5" fill="#404040" textAnchor="middle">100</text>
                <text x="5" y="90" fontSize="2.5" fill="#404040" textAnchor="end">0</text>
                <text x="5" y="50" fontSize="2.5" fill="#404040" textAnchor="end">50</text>
                <text x="5" y="10" fontSize="2.5" fill="#404040" textAnchor="end">100</text>

                {/* The Curve - straight line for constant sum */}
                <path
                  d={curvePath}
                  fill="none"
                  stroke="url(#curveGradient)"
                  strokeWidth="1"
                  opacity="0.9"
                />

                {/* Previous position (faded) */}
                <circle
                  cx={previousPoint.x}
                  cy={100 - previousPoint.y}
                  r="1.5"
                  fill="#666"
                  opacity="0.3"
                />
                <circle
                  cx={previousPoint.x}
                  cy={100 - previousPoint.y}
                  r="2.5"
                  fill="none"
                  stroke="#666"
                  strokeWidth="0.3"
                  opacity="0.3"
                />

                {/* Movement arrow */}
                <line
                  x1={previousPoint.x}
                  y1={100 - previousPoint.y}
                  x2={currentPoint.x}
                  y2={100 - currentPoint.y}
                  stroke="#f97316"
                  strokeWidth="0.3"
                  strokeDasharray="0.5,0.5"
                  opacity="0.6"
                  markerEnd="url(#arrowhead)"
                />

                {/* Arrow marker */}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#f97316"
                      opacity="0.6"
                    />
                  </marker>
                </defs>

                {/* Current position */}
                <circle
                  cx={currentPoint.x}
                  cy={100 - currentPoint.y}
                  r="2"
                  fill="#f97316"
                  filter="url(#glow)"
                  className="animate-pulse"
                />
                <circle
                  cx={currentPoint.x}
                  cy={100 - currentPoint.y}
                  r="3"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="0.5"
                  opacity="0.5"
                  className="animate-pulse"
                />

                {/* Price level lines */}
                <line
                  x1={currentPoint.x}
                  y1={100 - currentPoint.y}
                  x2={currentPoint.x}
                  y2="90"
                  stroke="#f97316"
                  strokeWidth="0.2"
                  strokeDasharray="1,1"
                  opacity="0.3"
                />
                <line
                  x1={currentPoint.x}
                  y1={100 - currentPoint.y}
                  x2="10"
                  y2={100 - currentPoint.y}
                  stroke="#f97316"
                  strokeWidth="0.2"
                  strokeDasharray="1,1"
                  opacity="0.3"
                />

                {/* Value labels */}
                <text 
                  x={currentPoint.x} 
                  y="87" 
                  fontSize="2.5" 
                  fill="#f97316" 
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {yesOdds.toFixed(1)}%
                </text>
                <text 
                  x="13" 
                  y={100 - currentPoint.y + 0.5} 
                  fontSize="2.5" 
                  fill="#f97316" 
                  textAnchor="start"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {noOdds.toFixed(1)}%
                </text>
              </svg>
            </div>

            {/* Curve Movement Indicator */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                <span className="text-xs text-gray-400">Previous Position</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
                <span className="text-xs text-gray-400">Current Position</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span className="text-xs text-gray-400">Movement</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="space-y-4">
          {/* Current Odds */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <h3 className="text-lg font-semibold text-orange-400 mb-3">Current Odds</h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-green-400 font-medium">YES</span>
                  <span className="text-green-400 font-bold">{yesOdds.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
                    style={{ width: `${yesOdds}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-red-400 font-medium">NO</span>
                  <span className="text-red-400 font-bold">{noOdds.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
                    style={{ width: `${noOdds}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pool Reserves */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <h3 className="text-lg font-semibold text-orange-400 mb-3">Pool Reserves</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">YES Tokens</span>
                <span className="text-white font-mono">{reserves.yes.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">NO Tokens</span>
                <span className="text-white font-mono">{reserves.no.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-700">
                <span className="text-gray-400">Sum (YES + NO)</span>
                <span className="text-orange-400 font-mono">1.00</span>
              </div>
            </div>
          </div>

          {/* Last Trade */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <h3 className="text-lg font-semibold text-orange-400 mb-3">Last Trade</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Type</span>
                <span className={`font-medium ${
                  lastTrade.type === 'BUY_YES' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {lastTrade.type.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount</span>
                <span className="text-white font-mono">{lastTrade.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Price Change</span>
                <span className="text-yellow-400 font-mono">{(lastTrade.priceChange * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Time</span>
                <span className="text-white">{timeSinceLastTrade()}</span>
              </div>
            </div>
          </div>

          {/* Price Info */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <h3 className="text-lg font-semibold text-orange-400 mb-3">Price Info</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">YES Price</span>
                <span className="text-green-400 font-mono">${yesPrice.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">NO Price</span>
                <span className="text-red-400 font-mono">${noPrice.toFixed(3)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-700">
                <span className="text-gray-400">Sum</span>
                <span className="text-orange-400 font-mono">${(yesPrice + noPrice).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-orange-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-gray-300">
            <p className="font-semibold mb-1 text-orange-400">How the Constant Sum Curve Works</p>
            <p>The constant sum AMM maintains the equation X+Y = k. When traders buy YES tokens, they remove YES from the pool and add NO tokens, moving the point along the straight line. Unlike constant product curves, this provides zero slippage and constant 1:1 pricing until one side of the pool is depleted. This makes it ideal for prediction markets where YES and NO tokens should sum to a fixed probability (100%).</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidityCurve;