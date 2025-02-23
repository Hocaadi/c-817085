import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type Strategy = {
  id: string;
  name: string;
  description: string;
  indicators: string[];
  config?: {
    atrPeriod: number;
    stopLossMultiplier: number;
    profitTargetMultiplier: number;
    stdctc: number;
  };
};

const strategies: Strategy[] = [
  {
    id: "aadarsh-bull",
    name: "Aadarsh Bull Strategy",
    description: "Custom momentum strategy with ATR-based stops and targets",
    indicators: ["ATR", "Price Action"],
    config: {
      atrPeriod: 30,
      stopLossMultiplier: 3,
      profitTargetMultiplier: 6,
      stdctc: 100
    }
  },
  {
    id: "moving-average",
    name: "Moving Average Crossover",
    description: "Uses 50 and 200 day moving averages to identify trends",
    indicators: ["MA50", "MA200"]
  },
  {
    id: "rsi",
    name: "RSI Strategy",
    description: "Uses RSI to identify overbought and oversold conditions",
    indicators: ["RSI"]
  },
  {
    id: "macd",
    name: "MACD Strategy",
    description: "Uses MACD for trend following and momentum",
    indicators: ["MACD", "Signal"]
  }
];

interface StrategySelectorProps {
  onStrategyChange: (strategy: Strategy) => void;
}

const StrategySelector = ({ onStrategyChange }: StrategySelectorProps) => {
  return (
    <div className="flex items-center gap-4 mb-4">
      <Select onValueChange={(value) => {
        const strategy = strategies.find(s => s.id === value);
        if (strategy) onStrategyChange(strategy);
      }}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select Strategy" />
        </SelectTrigger>
        <SelectContent>
          {strategies.map((strategy) => (
            <SelectItem key={strategy.id} value={strategy.id}>
              {strategy.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default StrategySelector; 