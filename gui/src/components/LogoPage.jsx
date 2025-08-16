import SimpleLogo from './SimpleLogo';

const LogoPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-orange-500 mb-4">AMM Curves Visualization</h2>
        <p className="text-gray-400">Mathematical representation of different Automated Market Maker models</p>
      </div>

      {/* Large Logo Display */}
      <div className="flex justify-center mb-12">
        <div className="bg-zinc-900 rounded-2xl p-12 border border-zinc-800">
          <SimpleLogo size={300} />
        </div>
      </div>

      {/* Logo Explanation */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-zinc-900 rounded-xl p-6 border border-red-900/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <h3 className="text-xl font-bold text-red-400">Constant Product: X·Y = k</h3>
          </div>
          <p className="text-gray-300 mb-3">
            The red curve represents the constant product formula used by Uniswap V2 and similar AMMs.
          </p>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>• Maintains liquidity at all price levels</li>
            <li>• Provides infinite liquidity (theoretically)</li>
            <li>• Price impact increases with trade size</li>
            <li>• Most common AMM model in DeFi</li>
          </ul>
        </div>

        <div className="bg-zinc-900 rounded-xl p-6 border border-green-900/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <h3 className="text-xl font-bold text-green-400">Constant Sum: X+Y = k</h3>
          </div>
          <p className="text-gray-300 mb-3">
            The green line represents the constant sum formula for stable asset pairs.
          </p>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>• Linear price relationship</li>
            <li>• Zero slippage until liquidity depletes</li>
            <li>• Ideal for stable pairs (1:1 assets)</li>
            <li>• Can be drained if price deviates</li>
          </ul>
        </div>
      </div>

      {/* Intersection Point */}
      <div className="bg-zinc-900 rounded-xl p-6 border border-orange-900/30 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
          <h3 className="text-xl font-bold text-orange-400">Intersection Point</h3>
        </div>
        <p className="text-gray-300">
          The orange dot marks where both curves intersect, representing the equilibrium point where both AMM models 
          would produce the same exchange rate. This typically occurs at the balanced state where X = Y.
        </p>
      </div>

      {/* Size Variations */}
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <h3 className="text-xl font-bold text-orange-500 mb-6">Logo Size Variations</h3>
        <div className="flex items-center justify-around flex-wrap gap-8">
          <div className="text-center">
            <SimpleLogo size={40} />
            <p className="text-xs text-gray-400 mt-2">40px</p>
          </div>
          <div className="text-center">
            <SimpleLogo size={60} />
            <p className="text-xs text-gray-400 mt-2">60px</p>
          </div>
          <div className="text-center">
            <SimpleLogo size={80} />
            <p className="text-xs text-gray-400 mt-2">80px</p>
          </div>
          <div className="text-center">
            <SimpleLogo size={100} />
            <p className="text-xs text-gray-400 mt-2">100px</p>
          </div>
          <div className="text-center">
            <SimpleLogo size={120} />
            <p className="text-xs text-gray-400 mt-2">120px</p>
          </div>
        </div>
      </div>

      {/* Math Formulas */}
      <div className="mt-8 bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <h3 className="text-xl font-bold text-orange-500 mb-4">Mathematical Formulas</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-red-400 font-semibold mb-2">Constant Product AMM</h4>
            <div className="bg-black rounded-lg p-4 font-mono text-sm">
              <p className="text-red-300">X · Y = k</p>
              <p className="text-gray-500 mt-2">where:</p>
              <p className="text-gray-400">X = Reserve of token A</p>
              <p className="text-gray-400">Y = Reserve of token B</p>
              <p className="text-gray-400">k = Constant</p>
              <p className="text-gray-500 mt-2">Price formula:</p>
              <p className="text-red-300">Price = Y / X</p>
            </div>
          </div>
          <div>
            <h4 className="text-green-400 font-semibold mb-2">Constant Sum AMM</h4>
            <div className="bg-black rounded-lg p-4 font-mono text-sm">
              <p className="text-green-300">X + Y = k</p>
              <p className="text-gray-500 mt-2">where:</p>
              <p className="text-gray-400">X = Reserve of token A</p>
              <p className="text-gray-400">Y = Reserve of token B</p>
              <p className="text-gray-400">k = Constant</p>
              <p className="text-gray-500 mt-2">Price formula:</p>
              <p className="text-green-300">Price = 1 (constant)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoPage;