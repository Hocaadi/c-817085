import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useTrading } from '@/contexts/TradingContext';
import { toast } from '@/hooks/useToast';
import { Strategy } from '@/lib/supabase';
import { useAuth } from '@clerk/clerk-react';
import { PlayCircle } from 'lucide-react';

const AVAILABLE_STRATEGIES = [
  {
    id: 'rsi-strategy',
    name: 'RSI Strategy',
    description: 'Relative Strength Index based trading strategy',
    parameters: {
      symbol: 'BTC-USDT',
      timeframe: '1h',
      rsiPeriod: 14,
      overbought: 70,
      oversold: 30
    }
  },
  {
    id: 'ma-strategy',
    name: 'Moving Average Strategy',
    description: 'Moving Average Crossover trading strategy',
    parameters: {
      symbol: 'BTC-USDT',
      timeframe: '1h',
      fastPeriod: 9,
      slowPeriod: 21
    }
  }
];

const AVAILABLE_TIMEFRAMES = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: 'Daily' }
];

export function StrategySelector() {
  const { startStrategy } = useTrading();
  const { userId } = useAuth();
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');

  const handleStartStrategy = async () => {
    try {
      if (!userId) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Please sign in to start trading"
        });
        return;
      }

      // Validate inputs
      if (!selectedStrategy) {
        toast({
          variant: "destructive",
          title: "Invalid Strategy",
          description: "Please select a trading strategy"
        });
        return;
      }

      if (!selectedTimeframe) {
        toast({
          variant: "destructive",
          title: "Invalid Timeframe",
          description: "Please select a timeframe"
        });
        return;
      }

      const parsedQuantity = parseFloat(quantity);
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        toast({
          variant: "destructive",
          title: "Invalid Quantity",
          description: "Please enter a valid quantity greater than 0"
        });
        return;
      }

      // Find the selected strategy configuration
      const strategyConfig = AVAILABLE_STRATEGIES.find(s => s.id === selectedStrategy);
      if (!strategyConfig) {
        toast({
          variant: "destructive",
          title: "Strategy Error",
          description: "Selected strategy configuration not found"
        });
        return;
      }

      // Create strategy instance
      const strategy: Strategy = {
        id: `${strategyConfig.id}-${Date.now()}`,
        user_id: userId,
        name: strategyConfig.name,
        description: strategyConfig.description,
        parameters: {
          ...strategyConfig.parameters,
          timeframe: selectedTimeframe,
          quantity: parsedQuantity
        },
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        performance_metrics: {
          totalTrades: 0,
          winRate: 0,
          profitFactor: 0,
          sharpeRatio: 0,
          maxDrawdown: 0
        }
      };

      // Start the strategy
      await startStrategy(strategy);

      // Reset form
      setSelectedStrategy('');
      setSelectedTimeframe('');
      setQuantity('1');

    } catch (error) {
      console.error('Failed to start strategy:', error);
      toast({
        variant: "destructive",
        title: "Strategy Error",
        description: error instanceof Error ? error.message : "Failed to start strategy"
      });
    }
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
              {AVAILABLE_TIMEFRAMES.map((timeframe) => (
                <SelectItem key={timeframe.value} value={timeframe.value}>
                  {timeframe.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-32 space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Quantity</label>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="bg-background/50"
            min="0.001"
            step="0.001"
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
            <span>RSI Period: {selectedStrategyDetails.parameters.rsiPeriod || '-'}</span>
            {selectedStrategyDetails.parameters.overbought && (
              <span>Overbought: {selectedStrategyDetails.parameters.overbought}</span>
            )}
            {selectedStrategyDetails.parameters.oversold && (
              <span>Oversold: {selectedStrategyDetails.parameters.oversold}</span>
            )}
            {selectedStrategyDetails.parameters.fastPeriod && (
              <span>Fast MA: {selectedStrategyDetails.parameters.fastPeriod}</span>
            )}
            {selectedStrategyDetails.parameters.slowPeriod && (
              <span>Slow MA: {selectedStrategyDetails.parameters.slowPeriod}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 