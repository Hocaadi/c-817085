import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Timer, Activity, TrendingUp, AlertTriangle } from 'lucide-react';

interface StrategyStatus {
  id: string;
  name: string;
  status: 'active' | 'stopped' | 'error';
  startTime?: Date;
  stopTime?: Date;
  timeframes: string[];
  profit: number;
  trades: number;
}

export function StrategyMonitor() {
  const [strategies, setStrategies] = useState<StrategyStatus[]>([]);

  const formatDuration = (start: Date, end: Date = new Date()) => {
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Active Strategies</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strategies.map((strategy) => (
          <Card key={strategy.id} className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold">{strategy.name}</h3>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Timer className="w-4 h-4" />
                  <span>
                    {strategy.startTime &&
                      formatDuration(strategy.startTime)}
                  </span>
                </div>
              </div>
              <div
                className={`px-2 py-1 rounded text-xs ${
                  strategy.status === 'active'
                    ? 'bg-green-500/20 text-green-500'
                    : strategy.status === 'stopped'
                    ? 'bg-yellow-500/20 text-yellow-500'
                    : 'bg-red-500/20 text-red-500'
                }`}
              >
                {strategy.status.toUpperCase()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  Trades: {strategy.trades}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className={`text-sm ${
                  strategy.profit >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {strategy.profit >= 0 ? '+' : ''}{strategy.profit}%
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-muted-foreground">
                Timeframes: {strategy.timeframes.join(', ')}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {strategies.length === 0 && (
        <Card className="p-6 text-center text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No active strategies</p>
          <p className="text-sm">Select a strategy and timeframe to begin trading</p>
        </Card>
      )}
    </div>
  );
} 