import { useState } from 'react';
import StrategySelector, { Strategy } from '@/components/StrategySelector';
import { useAadarshStrategy } from '@/hooks/useAadarshStrategy';
import { TradingViewChart } from '@/components/TradingViewChart';

const TradingPage = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const { signals, isLoading } = useAadarshStrategy();
  
  // Sample data - replace with your actual data source
  const sampleData = [
    { time: '2024-02-22', open: 54.62, high: 55.50, low: 54.52, close: 54.90 },
    { time: '2024-02-23', open: 55.08, high: 55.27, low: 54.61, close: 54.98 },
    // Add more data points...
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Trading Terminal</h1>
        <StrategySelector onStrategyChange={setSelectedStrategy} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trading Chart Section */}
        <div className="lg:col-span-2 glass-card p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Chart</h2>
          <div className="rounded-lg border bg-card p-4">
            <TradingViewChart 
              data={sampleData}
              colors={{
                backgroundColor: '#141413',
                textColor: '#DDD',
              }}
            />
          </div>
        </div>

        {/* Trading Panel */}
        <div className="glass-card p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Trading Panel</h2>
          
          {selectedStrategy && signals && (
            <div className="space-y-6">
              {/* Strategy Info */}
              <div className="strategy-info">
                <h3 className="font-medium">{selectedStrategy.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedStrategy.description}</p>
              </div>

              {/* Signal Indicator */}
              <div className="p-4 rounded-lg bg-secondary/10">
                <div className="flex justify-between items-center">
                  <span>Signal:</span>
                  <span className={`strategy-badge ${
                    signals.buySignal 
                      ? 'bg-success/20 text-success' 
                      : 'bg-warning/20 text-warning'
                  }`}>
                    {signals.buySignal ? 'BUY' : 'WAIT'}
                  </span>
                </div>
              </div>

              {/* Trade Form */}
              <form className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Amount (USD)</label>
                  <input 
                    type="number" 
                    className="w-full mt-1 p-2 rounded-md bg-secondary/20 border border-secondary"
                    placeholder="Enter amount..."
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Leverage</label>
                  <select className="w-full mt-1 p-2 rounded-md bg-secondary/20 border border-secondary">
                    <option>1x</option>
                    <option>2x</option>
                    <option>5x</option>
                    <option>10x</option>
                  </select>
                </div>

                <button 
                  className={`w-full py-2 px-4 rounded-md ${
                    signals.buySignal 
                      ? 'bg-success hover:bg-success/90' 
                      : 'bg-secondary hover:bg-secondary/90'
                  }`}
                  disabled={!signals.buySignal}
                >
                  Place Trade
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradingPage; 