import { Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  value: string;
  onValueChange: (value: string) => void;
}

const StrategySelector = ({ value, onValueChange }: StrategySelectorProps) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[240px] bg-secondary/10 border-secondary/20 hover:bg-secondary/20 transition-colors">
        <SelectValue placeholder="Select Strategy" />
      </SelectTrigger>
      <SelectContent className="bg-background/95 backdrop-blur-sm border-secondary/20">
        <SelectGroup>
          <SelectLabel className="text-muted-foreground">Trading Strategies</SelectLabel>
          <SelectItem 
            value="rsi-divergence"
            className="hover:bg-secondary/10 cursor-pointer focus:bg-secondary/20 rounded-sm"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1">RSI Divergence</div>
              {value === "rsi-divergence" && <Check className="h-4 w-4 text-primary" />}
            </div>
          </SelectItem>
          <SelectItem 
            value="ma-crossover"
            className="hover:bg-secondary/10 cursor-pointer focus:bg-secondary/20 rounded-sm"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1">MA Crossover</div>
              {value === "ma-crossover" && <Check className="h-4 w-4 text-primary" />}
            </div>
          </SelectItem>
          <SelectItem 
            value="breakout"
            className="hover:bg-secondary/10 cursor-pointer focus:bg-secondary/20 rounded-sm"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1">Breakout Strategy</div>
              {value === "breakout" && <Check className="h-4 w-4 text-primary" />}
            </div>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default StrategySelector; 