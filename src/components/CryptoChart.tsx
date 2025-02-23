import { useState, useEffect } from 'react';
import { TradingViewChart } from './TradingViewChart';
import StrategySelector, { Strategy } from './StrategySelector';
import { useAadarshStrategy } from '@/hooks/useAadarshStrategy';

const CryptoChart = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const { signals, isLoading, priceData } = useAadarshStrategy();
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (selectedStrategy?.id === 'aadarsh-bull' && signals) {
      console.log('Strategy Signals:', signals);
    }
  }, [selectedStrategy, signals]);

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
      
      {/* Debug Panel */}
      {showDebug && (
        <div className="mb-4 p-4 bg-secondary/10 rounded-md text-sm font-mono">
          <div className="flex justify-between mb-2">
            <span>Strategy Active:</span>
            <span>{selectedStrategy?.id === 'aadarsh-bull' ? '✅' : '❌'}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Data Loading:</span>
            <span>{isLoading ? '⏳' : '✅'}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Price Data Points:</span>
            <span>{priceData?.length || 0}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Signals Available:</span>
            <span>{signals ? '✅' : '❌'}</span>
          </div>
          {signals && (
            <>
              <div className="flex justify-between mb-2">
                <span>Buy Signal:</span>
                <span>{signals.buySignal ? '✅' : '❌'}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Sell Signal:</span>
                <span>{signals.sellSignal ? '✅' : '❌'}</span>
              </div>
              <div className="mt-2 border-t border-secondary/20 pt-2">
                <div className="font-bold mb-1">Raw Data:</div>
                <pre className="text-xs overflow-auto max-h-40">
                  {JSON.stringify({
                    selectedStrategy: selectedStrategy?.config,
                    signals,
                    latestPrice: priceData?.[priceData.length - 1],
                    indicators: selectedStrategy?.indicators
                  }, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      )}

      {/* Strategy Info */}
      {selectedStrategy?.id === 'aadarsh-bull' && signals && (
        <div className="strategy-info">
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
        <TradingViewChart 
          data={priceData}
          colors={{
            backgroundColor: '#141413',
            textColor: '#DDD',
          }}
        />
      </div>
    </div>
  );
};

export default CryptoChart;