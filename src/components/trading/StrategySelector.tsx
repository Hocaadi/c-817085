import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlayCircle } from 'lucide-react';

interface Strategy {
  id: string;
  name: string;
  description: string;
  parameters: {
    stopLoss: number;
    takeProfit: number;
  };
}

const AVAILABLE_STRATEGIES: Strategy[] = [
  {
    id: 'rsi-divergence',
    name: 'RSI Divergence',
    description: 'Identifies potential reversals using RSI divergence patterns',
    parameters: {
      stopLoss: 2,
      takeProfit: 4
    }
  },
  {
    id: 'ma-crossover',
    name: 'MA Crossover',
    description: 'Trading based on moving average crossovers',
    parameters: {
      stopLoss: 1.5,
      takeProfit: 3
    }
  },
  {
    id: 'breakout',
    name: 'Breakout Strategy',
    description: 'Captures price breakouts from key levels',
    parameters: {
      stopLoss: 2.5,
      takeProfit: 5
    }
  }
];

const TIMEFRAMES = [
  { value: '1m', label: '1 minute' },
  { value: '5m', label: '5 minutes' },
  { value: '15m', label: '15 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '4h', label: '4 hours' },
  { value: '1d', label: '1 day' },
  { value: '1w', label: '1 week' },
];

export function StrategySelector() {
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('0');

  const handleStartStrategy = () => {
    if (!selectedStrategy || !selectedTimeframe || Number(quantity) <= 0) {
      alert('Please select a strategy, timeframe, and valid quantity');
      return;
    }
    // Add your strategy start logic here
  };

  const selectedStrategyDetails = AVAILABLE_STRATEGIES.find(s => s.id === selectedStrategy);

  return (
    <div className="bg-card/30 rounded-lg p-4">
      <div className="flex items-end gap-4">
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Strategy</label>
          <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="Select strategy..." />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_STRATEGIES.map((strategy) => (
                <SelectItem key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Timeframe</label>
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="Select timeframe..." />
            </SelectTrigger>
            <SelectContent>
              {TIMEFRAMES.map((timeframe) => (
                <SelectItem key={timeframe.value} value={timeframe.value}>
                  {timeframe.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-32 space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Quantity</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-input bg-background/50"
            min="0"
            step="0.01"
          />
        </div>

        <Button 
          onClick={handleStartStrategy}
          className="bg-green-600 hover:bg-green-700 h-10"
          size="sm"
          disabled={!selectedStrategy || !selectedTimeframe || Number(quantity) <= 0}
        >
          <PlayCircle className="w-4 h-4 mr-2" />
          Start
        </Button>
      </div>

      {selectedStrategyDetails && (
        <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
          <p className="flex-1">{selectedStrategyDetails.description}</p>
          <div className="flex gap-4 ml-4">
            <span>Stop Loss: {selectedStrategyDetails.parameters.stopLoss}%</span>
            <span>Take Profit: {selectedStrategyDetails.parameters.takeProfit}%</span>
          </div>
        </div>
      )}
    </div>
  );
} 