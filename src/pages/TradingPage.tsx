import { useState } from 'react';
import { StrategySelector } from '@/components/trading/StrategySelector';
import { StrategyMonitor } from '@/components/trading/StrategyMonitor';
import { PositionTable } from '@/components/trading/PositionTable';
import { RiskMetrics } from '@/components/trading/RiskMetrics';
import { useTrading } from '@/contexts/TradingContext';

export default function TradingPage() {
  const { handleKillSwitch } = useTrading();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Trading Terminal</h1>
          <div className="flex gap-4">
            <button
              onClick={() => handleKillSwitch('PREVENT_NEW')}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
            >
              Prevent New Trades
            </button>
            <button
              onClick={() => handleKillSwitch('CLOSE_ALL')}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Close All Positions
            </button>
            <button
              onClick={() => handleKillSwitch('BOTH')}
              className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded"
            >
              Emergency Stop
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">Strategy Selection</h2>
            <StrategySelector />
          </section>

          <section>
            <StrategyMonitor />
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Risk Metrics</h2>
            <RiskMetrics />
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Open Positions</h2>
            <PositionTable />
          </section>
        </div>
      </div>
    </div>
  );
} 