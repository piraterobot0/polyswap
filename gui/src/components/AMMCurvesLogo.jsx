const AMMCurvesLogo = ({ size = 200, showLabels = true, animated = false }) => {
  // Generate points for constant product curve (X*Y = k)
  const k_product = 2500; // k value for X*Y = k
  const productCurvePoints = [];
  for (let x = 10; x <= 90; x += 2) {
    const y = k_product / x;
    if (y >= 10 && y <= 90) {
      productCurvePoints.push({ x, y });
    }
  }

  // Generate points for constant sum curve (X+Y = k)
  const k_sum = 100; // k value for X+Y = k
  const sumCurvePoints = [
    { x: 10, y: 90 },
    { x: 90, y: 10 }
  ];

  // Convert points to SVG path
  const createPath = (points) => {
    if (points.length === 0) return '';
    return points.reduce((path, point, index) => {
      const cmd = index === 0 ? 'M' : 'L';
      return `${path} ${cmd} ${point.x},${100 - point.y}`;
    }, '');
  };

  const productPath = createPath(productCurvePoints);
  const sumPath = createPath(sumCurvePoints);

  return (
    <div className="inline-flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="overflow-visible"
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1a1a1a" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
            
            {/* Gradients for curves */}
            <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
            
            <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>

            {/* Glow effects */}
            <filter id="redGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            <filter id="greenGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Grid background */}
          <rect width="100" height="100" fill="url(#grid)" />
          
          {/* Axes */}
          <line x1="10" y1="90" x2="90" y2="90" stroke="#404040" strokeWidth="1" />
          <line x1="10" y1="10" x2="10" y2="90" stroke="#404040" strokeWidth="1" />
          
          {/* Arrow heads for axes */}
          <polygon points="90,88 90,92 94,90" fill="#404040" />
          <polygon points="8,10 12,10 10,6" fill="#404040" />

          {/* Constant Product Curve (X*Y = k) - Red */}
          <path
            d={productPath}
            fill="none"
            stroke="url(#redGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#redGlow)"
            className={animated ? "animate-pulse" : ""}
            opacity="0.9"
          />

          {/* Constant Sum Curve (X+Y = k) - Green */}
          <path
            d={sumPath}
            fill="none"
            stroke="url(#greenGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#greenGlow)"
            className={animated ? "animate-pulse animation-delay-1000" : ""}
            opacity="0.9"
          />

          {/* Intersection point */}
          <circle
            cx="50"
            cy="50"
            r="3"
            fill="#f97316"
            className={animated ? "animate-pulse" : ""}
          />
          <circle
            cx="50"
            cy="50"
            r="5"
            fill="none"
            stroke="#f97316"
            strokeWidth="1"
            opacity="0.5"
          />

          {/* Labels */}
          {showLabels && (
            <>
              {/* X axis label */}
              <text x="92" y="95" fontSize="6" fill="#666" fontFamily="monospace">X</text>
              
              {/* Y axis label */}
              <text x="5" y="8" fontSize="6" fill="#666" fontFamily="monospace">Y</text>

              {/* Curve labels */}
              <text x="65" y="25" fontSize="5" fill="#dc2626" fontFamily="monospace" fontWeight="bold">
                X·Y = k
              </text>
              <text x="25" y="40" fontSize="5" fill="#16a34a" fontFamily="monospace" fontWeight="bold">
                X+Y = k
              </text>
            </>
          )}

          {/* Corner decoration */}
          <g opacity="0.3">
            <circle cx="10" cy="90" r="1.5" fill="#f97316" />
            <circle cx="90" cy="10" r="1.5" fill="#f97316" />
            <circle cx="10" cy="10" r="1.5" fill="#666" />
            <circle cx="90" cy="90" r="1.5" fill="#666" />
          </g>
        </svg>

        {/* Animated particles (optional) */}
        {animated && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="animate-float-1 absolute w-1 h-1 bg-red-500 rounded-full opacity-50" 
                 style={{ left: '70%', top: '30%' }} />
            <div className="animate-float-2 absolute w-1 h-1 bg-green-500 rounded-full opacity-50" 
                 style={{ left: '30%', top: '50%' }} />
            <div className="animate-float-3 absolute w-1 h-1 bg-orange-500 rounded-full opacity-50" 
                 style={{ left: '50%', top: '50%' }} />
          </div>
        )}
      </div>

      {/* Title below logo */}
      <div className="mt-4 text-center">
        <div className="text-orange-500 font-bold text-lg">PolySwap</div>
        <div className="text-gray-400 text-xs mt-1">AMM Curves Visualized</div>
      </div>
    </div>
  );
};

export default AMMCurvesLogo;