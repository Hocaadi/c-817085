import { useTrading } from '../../contexts/TradingContext';

export function RiskMetrics() {
  const { riskMetrics } = useTrading();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-secondary/5 rounded-lg p-4">
        <h3 className="text-sm text-secondary-foreground/60 mb-1">
          Current Drawdown
        </h3>
        <p className="text-2xl font-semibold">
          {riskMetrics.currentDrawdown.toFixed(2)}%
        </p>
      </div>

      <div className="bg-secondary/5 rounded-lg p-4">
        <h3 className="text-sm text-secondary-foreground/60 mb-1">
          Max Drawdown
        </h3>
        <p className="text-2xl font-semibold">
          {riskMetrics.maxDrawdown.toFixed(2)}%
        </p>
      </div>

      <div className="bg-secondary/5 rounded-lg p-4">
        <h3 className="text-sm text-secondary-foreground/60 mb-1">
          Total Equity
        </h3>
        <p className="text-2xl font-semibold">
          ${riskMetrics.totalEquity.toFixed(2)}
        </p>
      </div>

      <div className="bg-secondary/5 rounded-lg p-4">
        <h3 className="text-sm text-secondary-foreground/60 mb-1">
          Exposure
        </h3>
        <p className="text-2xl font-semibold">
          {riskMetrics.exposurePercentage.toFixed(2)}%
        </p>
      </div>
    </div>
  );
} 