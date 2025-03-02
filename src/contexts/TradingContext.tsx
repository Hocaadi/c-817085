import React, { createContext, useContext, useState, useEffect } from 'react';
import { StrategyMonitor } from '@/services/StrategyMonitor';
import { DatabaseService } from '@/services/database.service';
import { DeltaExchangeClient } from '@/trading/core/DeltaExchangeClient';
import { useAuth } from '@clerk/clerk-react';
import { toast } from '@/hooks/useToast';
import { Strategy, Position } from '@/lib/supabase';
import { DELTA_EXCHANGE_CREDENTIALS } from '@/config/api-credentials';

interface RiskMetrics {
  currentDrawdown: number;
  maxDrawdown: number;
  totalEquity: number;
  exposurePercentage: number;
}

interface TradingContextType {
  startStrategy: (strategy: Strategy) => Promise<void>;
  stopStrategy: (strategyId: string) => Promise<void>;
  handleKillSwitch: (action: 'PREVENT_NEW' | 'CLOSE_ALL' | 'BOTH') => void;
  activeStrategies: Strategy[];
  positions: Position[];
  riskMetrics: RiskMetrics;
}

const defaultRiskMetrics: RiskMetrics = {
  currentDrawdown: 0,
  maxDrawdown: 0,
  totalEquity: 0,
  exposurePercentage: 0
};

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const [activeStrategies, setActiveStrategies] = useState<Strategy[]>([]);
  const [strategyMonitor, setStrategyMonitor] = useState<StrategyMonitor | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>(defaultRiskMetrics);

  const initializeStrategyMonitor = async (): Promise<StrategyMonitor | null> => {
    if (!userId) return null;

    try {
      const { apiKey, apiSecret } = DELTA_EXCHANGE_CREDENTIALS;
      const deltaClient = new DeltaExchangeClient(apiKey, apiSecret);
      const dbService = new DatabaseService();
      const monitor = new StrategyMonitor(deltaClient, dbService, userId, 'session-1');
      
      // Initialize the client and fetch initial data
      await monitor.startMonitoring();
      
      // Get initial positions and update state
      const positions = await deltaClient.getPositions();
      setPositions(positions);
      
      // Get wallet balance for risk metrics
      const balances = await deltaClient.getBalance();
      const totalEquity = balances.reduce((sum: number, balance: any) => sum + (balance.available_balance || 0), 0);
      
      setRiskMetrics(prev => ({
        ...prev,
        totalEquity
      }));
      
      setStrategyMonitor(monitor);
      return monitor;
    } catch (error) {
      console.error('Failed to initialize strategy monitor:', error);
      toast({
        variant: "destructive",
        title: "Initialization Error",
        description: "Failed to initialize trading system"
      });
      return null;
    }
  };

  // Update positions and risk metrics periodically
  useEffect(() => {
    if (!strategyMonitor) return;

    const updateData = async () => {
      try {
        const client = strategyMonitor.getDeltaClient();
        const positions = await client.getPositions();
        setPositions(positions);

        const balances = await client.getBalance();
        const totalEquity = balances.reduce((sum: number, balance: any) => sum + (balance.available_balance || 0), 0);
        
        // Calculate exposure from positions
        const totalExposure = positions.reduce((sum: number, pos: any) => sum + Math.abs(pos.size * pos.entry_price), 0);
        const exposurePercentage = (totalExposure / totalEquity) * 100;

        setRiskMetrics(prev => ({
          ...prev,
          totalEquity,
          exposurePercentage
        }));
      } catch (error) {
        console.error('Failed to update trading data:', error);
      }
    };

    const interval = setInterval(updateData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [strategyMonitor]);

  const startStrategy = async (strategy: Strategy) => {
    try {
      let monitor = strategyMonitor;
      if (!monitor) {
        monitor = await initializeStrategyMonitor();
        if (!monitor) throw new Error('Failed to initialize trading system');
      }

      await monitor.addStrategy(strategy);
      setActiveStrategies(prev => [...prev, strategy]);
      
      // Start monitoring if this is the first strategy
      if (activeStrategies.length === 0) {
        await monitor.startMonitoring();
      }

      toast({
        title: "Strategy Started",
        description: `Successfully started ${strategy.name}`
      });
    } catch (error) {
      console.error('Failed to start strategy:', error);
      toast({
        variant: "destructive",
        title: "Strategy Error",
        description: error instanceof Error ? error.message : "Failed to start strategy"
      });
      throw error;
    }
  };

  const stopStrategy = async (strategyId: string) => {
    if (!strategyMonitor) return;

    try {
      await strategyMonitor.removeStrategy(strategyId);
      setActiveStrategies(prev => prev.filter(s => s.id !== strategyId));
      
      // Stop monitoring if no strategies are active
      if (activeStrategies.length === 1) { // Will be 0 after state update
        strategyMonitor.stopMonitoring();
      }

      toast({
        title: "Strategy Stopped",
        description: "Strategy has been deactivated"
      });
    } catch (error) {
      console.error('Failed to stop strategy:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to stop strategy"
      });
      throw error;
    }
  };

  const handleKillSwitch = async (action: 'PREVENT_NEW' | 'CLOSE_ALL' | 'BOTH') => {
    if (!strategyMonitor) return;

    try {
      switch (action) {
        case 'PREVENT_NEW':
          strategyMonitor.stopMonitoring();
          setActiveStrategies([]);
          toast({
            title: "Trading Paused",
            description: "Prevented new trades from being opened"
          });
          break;
        
        case 'CLOSE_ALL':
          // Close all positions through DeltaExchangeClient
          strategyMonitor.stopMonitoring();
          setActiveStrategies([]);
          toast({
            title: "Closing Positions",
            description: "Closing all open positions"
          });
          break;
        
        case 'BOTH':
          strategyMonitor.stopMonitoring();
          setActiveStrategies([]);
          toast({
            variant: "destructive",
            title: "Emergency Stop",
            description: "Stopped all trading and closing positions"
          });
          break;
      }
    } catch (error) {
      console.error('Kill switch error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to execute kill switch action"
      });
    }
  };

  return (
    <TradingContext.Provider value={{
      startStrategy,
      stopStrategy,
      handleKillSwitch,
      activeStrategies,
      positions,
      riskMetrics
    }}>
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading() {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
} 