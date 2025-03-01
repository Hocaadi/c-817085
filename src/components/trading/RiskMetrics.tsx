import { useTrading } from '../../contexts/TradingContext';

export function RiskMetrics() {
  const { riskMetrics = {
    currentDrawdown: 0,
    maxDrawdown: 0,
    totalEquity: 0,
    exposurePercentage: 0
  } } = useTrading();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-secondary/5 rounded-lg p-4">
        <h3 className="text-sm text-secondary-foreground/60 mb-1">
          Current Drawdown
        </h3>
        <p className="text-2xl font-semibold">
          {(riskMetrics.currentDrawdown || 0).toFixed(2)}%
        </p>
      </div>

      <div className="bg-secondary/5 rounded-lg p-4">
        <h3 className="text-sm text-secondary-foreground/60 mb-1">
          Max Drawdown
        </h3>
        <p className="text-2xl font-semibold">
          {(riskMetrics.maxDrawdown || 0).toFixed(2)}%
        </p>
      </div>

      <div className="bg-secondary/5 rounded-lg p-4">
        <h3 className="text-sm text-secondary-foreground/60 mb-1">
          Total Equity
        </h3>
        <p className="text-2xl font-semibold">
          ${(riskMetrics.totalEquity || 0).toFixed(2)}
        </p>
      </div>

      <div className="bg-secondary/5 rounded-lg p-4">
        <h3 className="text-sm text-secondary-foreground/60 mb-1">
          Exposure
        </h3>
        <p className="text-2xl font-semibold">
          {(riskMetrics.exposurePercentage || 0).toFixed(2)}%
        </p>
      </div>
    </div>
  );
} 