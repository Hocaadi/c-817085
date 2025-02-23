import { useState } from 'react';
import { TradingViewChart } from './TradingViewChart';
import StrategySelector, { Strategy } from './StrategySelector';
import { useAadarshStrategy } from '@/hooks/useAadarshStrategy';

const CryptoChart = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const { signals, isLoading } = useAadarshStrategy();
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="glass-card p-6 rounded-lg mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Bitcoin Price</h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="px-3 py-1 text-sm rounded-md bg-secondary/50 hover:bg-secondary/70"
          >
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </button>
          <StrategySelector onStrategyChange={setSelectedStrategy} />
        </div>
      </div>

      {/* Strategy Info Panel */}
      {selectedStrategy?.id === 'aadarsh-bull' && signals && showDebug && (
        <div className="strategy-info mb-4 p-4 bg-secondary/10 rounded-lg">
          <h3 className="text-sm font-medium mb-2">{selectedStrategy.name}</h3>
          <p className="text-sm text-muted-foreground">{selectedStrategy.description}</p>
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Signal:</span>
              <span className={`strategy-badge ${
                signals.buySignal 
                  ? 'bg-success/20 text-success' 
                  : 'bg-warning/20 text-warning'
              }`}>
                {signals.buySignal ? 'BUY' : 'WAIT'}
              </span>
            </div>
            {signals.levels && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Entry:</span>
                  <span className="font-mono">${signals.levels.entryPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Stop Loss:</span>
                  <span className="font-mono text-warning">${signals.levels.stopLoss.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Target:</span>
                  <span className="font-mono text-success">${signals.levels.profitTarget.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="h-[400px] w-full">
        <TradingViewChart symbol="BTCUSDT" theme="dark" />
      </div>
    </div>
  );
};

export default CryptoChart;