import { useState } from 'react';
import { useAadarshStrategy } from '@/hooks/useAadarshStrategy';
import StrategySelector from '@/components/StrategySelector';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, StopCircle } from 'lucide-react';

const TradingPage = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [isStrategyActive, setIsStrategyActive] = useState(false);
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
              <p className="text-muted-foreground">Select and manage your trading strategies</p>
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

          {/* Strategy Content */}
          {selectedStrategy ? (
            <div className="grid gap-6">
              {/* Strategy Stats */}
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

              {/* Strategy Details */}
              <Card className="p-6 bg-secondary/5 border-secondary/20">
                <h2 className="text-xl font-semibold mb-4">Strategy Parameters</h2>
                {/* Add strategy-specific parameters here */}
              </Card>
            </div>
          ) : (
            <div className="text-center p-12 bg-secondary/5 rounded-lg border border-dashed border-secondary/20">
              <h2 className="text-xl font-semibold mb-2">No Strategy Selected</h2>
              <p className="text-muted-foreground">
                Choose a trading strategy to begin trading
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradingPage; 