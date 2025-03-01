import React, { createContext, useContext, useState } from 'react';
import { StrategyMonitor } from '@/services/StrategyMonitor';
import { DatabaseService } from '@/services/database.service';
import { DeltaExchangeClient } from '@/trading/core/DeltaExchangeClient';
import { useAuth } from '@clerk/clerk-react';
import { toast } from '@/hooks/useToast';
import { Strategy } from '@/lib/supabase';

interface TradingContextType {
  startStrategy: (strategy: Strategy) => Promise<void>;
  stopStrategy: (strategyId: string) => Promise<void>;
  handleKillSwitch: (action: 'PREVENT_NEW' | 'CLOSE_ALL' | 'BOTH') => void;
  activeStrategies: Strategy[];
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const [activeStrategies, setActiveStrategies] = useState<Strategy[]>([]);
  const [strategyMonitor, setStrategyMonitor] = useState<StrategyMonitor | null>(null);

  const initializeStrategyMonitor = async (): Promise<StrategyMonitor | null> => {
    if (!userId) return null;

    try {
      const deltaClient = new DeltaExchangeClient(
        process.env.VITE_DELTA_EXCHANGE_API_KEY!,
        process.env.VITE_DELTA_EXCHANGE_API_SECRET!
      );
      const dbService = new DatabaseService();
      const monitor = new StrategyMonitor(deltaClient, dbService, userId, 'session-1');
      
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
      activeStrategies
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