import { useState } from 'react';
import { useAadarshStrategy } from '@/hooks/useAadarshStrategy';
import StrategySelector from '@/components/StrategySelector';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, StopCircle, TrendingUp, TrendingDown, History } from 'lucide-react';

const TradingPage = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [isStrategyActive, setIsStrategyActive] = useState(false);
  
  // Mock data - replace with actual data from your backend
  const mockProfitData = {
    total: 2547.89,
    strategies: {
      'rsi-divergence': 1245.67,
      'ma-crossover': 892.45,
      'breakout': 409.77
    },
    recentTrades: [
      { id: 1, strategy: 'RSI Divergence', profit: 125.45, time: '2h ago' },
      { id: 2, strategy: 'MA Crossover', profit: -45.23, time: '4h ago' },
      { id: 3, strategy: 'Breakout', profit: 89.67, time: '6h ago' },
    ]
  };

  const { positions, currentPrice, isLoading, error } = useAadarshStrategy(
    isStrategyActive && selectedStrategy === 'rsi-divergence'
  );

  const handleStrategyToggle = () => {
    setIsStrategyActive(!isStrategyActive);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Trading Terminal</h1>
              <p className="text-muted-foreground">Monitor your trading performance</p>
            </div>
            <div className="flex items-center gap-4">
              <StrategySelector
                value={selectedStrategy}
                onValueChange={setSelectedStrategy}
              />
              <Button
                variant={isStrategyActive ? "destructive" : "default"}
                size="lg"
                className="min-w-[120px]"
                onClick={handleStrategyToggle}
                disabled={!selectedStrategy}
              >
                {isStrategyActive ? (
                  <>
                    <StopCircle className="w-4 h-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Profit/Loss Display Section */}
          <Card className="p-8 bg-secondary/5 border-secondary/20">
            <div className="text-center mb-6">
              <h2 className="text-xl text-muted-foreground mb-2">
                {selectedStrategy ? `${selectedStrategy.toUpperCase()} Strategy Profit` : 'Total Portfolio Profit'}
              </h2>
              <div className={`text-5xl font-bold mb-2 ${
                (selectedStrategy ? mockProfitData.strategies[selectedStrategy] : mockProfitData.total) >= 0 
                ? 'text-green-500' 
                : 'text-red-500'
              }`}>
                ${(selectedStrategy ? mockProfitData.strategies[selectedStrategy] : mockProfitData.total).toLocaleString()}
              </div>
            </div>

            {/* Strategy Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(mockProfitData.strategies).map(([strategy, profit]) => (
                <Card 
                  key={strategy}
                  className={`p-4 ${selectedStrategy === strategy ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">{strategy}</h3>
                    {profit >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <p className={`text-xl font-bold mt-2 ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${profit.toLocaleString()}
                  </p>
                </Card>
              ))}
            </div>
          </Card>

          {/* Recent Trades Section */}
          <Card className="p-6 bg-secondary/5 border-secondary/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <History className="w-5 h-5" />
                Recent Trades
              </h2>
            </div>
            <div className="divide-y divide-secondary/20">
              {mockProfitData.recentTrades.map((trade) => (
                <div key={trade.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{trade.strategy}</p>
                    <p className="text-sm text-muted-foreground">{trade.time}</p>
                  </div>
                  <p className={`font-bold ${trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.profit >= 0 ? '+' : ''}{trade.profit.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Current Price and Stats */}
          {selectedStrategy && (
            <Card className="p-6 bg-secondary/5 border-secondary/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Current Price</h3>
                  <p className="text-2xl font-bold">${currentPrice?.toLocaleString() || '0.00'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Positions</h3>
                  <p className="text-2xl font-bold">{positions.length}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Win Rate</h3>
                  <p className="text-2xl font-bold">68%</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradingPage; 