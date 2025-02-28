import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PositionManager } from '@/trading/core/PositionManager';
import { DataManager } from '@/trading/core/DataManager';
import { Position, RiskMetrics } from '@/trading/core/types';

interface TradingContextType {
  positions: Position[];
  riskMetrics: RiskMetrics;
  isStrategyActive: boolean;
  selectedTimeframes: string[];
  selectedCoin: string;
  quantity: number;
  updateTimeframes: (timeframes: string[]) => void;
  updateCoin: (coin: string) => void;
  updateQuantity: (quantity: number) => void;
  toggleStrategy: () => void;
  handleKillSwitch: (mode: 'PREVENT_NEW' | 'CLOSE_ALL' | 'BOTH') => Promise<void>;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export function TradingProvider({ children }: { children: ReactNode }) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>({
    currentDrawdown: 0,
    maxDrawdown: 20,
    totalEquity: 0,
    exposurePercentage: 0
  });
  const [isStrategyActive, setIsStrategyActive] = useState(false);
  const [selectedTimeframes, setSelectedTimeframes] = useState(['1h']);
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [quantity, setQuantity] = useState(0);

  const positionManager = new PositionManager(
    'bnL0gxJ4BtlxVH2Jp7BLZewQSs7m7e',
    '38koYkvTiOtT9nSoleUmsmB8kqrEBCAZlafkoL7cuHo4sAPhyOkf0NlFh6iS'
  );

  useEffect(() => {
    const updateData = async () => {
      if (isStrategyActive) {
        await positionManager.updatePositions();
        setPositions(positionManager.getOpenPositions());
      }
    };

    const interval = setInterval(updateData, 5000);
    return () => clearInterval(interval);
  }, [isStrategyActive]);

  const handleKillSwitch = async (mode: 'PREVENT_NEW' | 'CLOSE_ALL' | 'BOTH') => {
    await positionManager.killSwitch(mode);
    setIsStrategyActive(false);
    await positionManager.updatePositions();
    setPositions(positionManager.getOpenPositions());
  };

  return (
    <TradingContext.Provider
      value={{
        positions,
        riskMetrics,
        isStrategyActive,
        selectedTimeframes,
        selectedCoin,
        quantity,
        updateTimeframes: setSelectedTimeframes,
        updateCoin: setSelectedCoin,
        updateQuantity: setQuantity,
        toggleStrategy: () => setIsStrategyActive(!isStrategyActive),
        handleKillSwitch
      }}
    >
      {children}
    </TradingContext.Provider>
  );
}

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
}; 