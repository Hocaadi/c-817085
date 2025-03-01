import { DeltaExchangeClient } from '@/trading/core/DeltaExchangeClient';
import { DatabaseService } from './database.service';
import { Strategy, Trade } from '@/lib/supabase';
import { OrderRequest } from '@/trading/core/types';
import { toast } from '@/hooks/useToast';

interface StrategySignal {
  strategy: Strategy;
  signal: 'BUY' | 'SELL';
  symbol: string;
  price: number;
  quantity: number;
  timestamp: number;
}

export class StrategyMonitor {
  private activeStrategies: Map<string, Strategy> = new Map();
  private isMonitoring: boolean = false;
  private signalCheckInterval: NodeJS.Timer | null = null;
  private readonly checkIntervalMs: number = 5000; // Check every 5 seconds

  constructor(
    private readonly deltaClient: DeltaExchangeClient,
    private readonly dbService: DatabaseService,
    private readonly userId: string,
    private readonly sessionId: string
  ) {}

  async addStrategy(strategy: Strategy) {
    this.activeStrategies.set(strategy.id, strategy);
    await this.dbService.updateStrategyMetrics(strategy.id, {
      ...strategy.performance_metrics,
      lastActivated: new Date().toISOString()
    });

    toast({
      title: "Strategy Added",
      description: `Now monitoring ${strategy.name}`
    });
  }

  async removeStrategy(strategyId: string) {
    const strategy = this.activeStrategies.get(strategyId);
    if (strategy) {
      this.activeStrategies.delete(strategyId);
      await this.dbService.updateStrategyMetrics(strategyId, {
        ...strategy.performance_metrics,
        lastDeactivated: new Date().toISOString()
      });

      toast({
        title: "Strategy Removed",
        description: `Stopped monitoring ${strategy.name}`
      });
    }
  }

  async startMonitoring() {
    if (this.isMonitoring) return;

    try {
      await this.deltaClient.startStrategy();
      this.isMonitoring = true;
      this.startSignalCheck();

      toast({
        title: "Monitoring Started",
        description: `Actively monitoring ${this.activeStrategies.size} strategies`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Monitoring Failed",
        description: error instanceof Error ? error.message : "Failed to start monitoring"
      });
      throw error;
    }
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.signalCheckInterval) {
      clearInterval(this.signalCheckInterval);
      this.signalCheckInterval = null;
    }
    this.deltaClient.stopStrategy();

    toast({
      title: "Monitoring Stopped",
      description: "All strategy monitoring has been stopped"
    });
  }

  private startSignalCheck() {
    this.signalCheckInterval = setInterval(async () => {
      try {
        const signals = await this.checkAllStrategySignals();
        for (const signal of signals) {
          await this.processSignal(signal);
        }
      } catch (error) {
        console.error('Error checking signals:', error);
      }
    }, this.checkIntervalMs);
  }

  private async checkAllStrategySignals(): Promise<StrategySignal[]> {
    const signals: StrategySignal[] = [];
    
    for (const strategy of this.activeStrategies.values()) {
      try {
        const strategySignals = await this.evaluateStrategy(strategy);
        signals.push(...strategySignals);
      } catch (error) {
        console.error(`Error evaluating strategy ${strategy.name}:`, error);
      }
    }

    return signals;
  }

  private async evaluateStrategy(strategy: Strategy): Promise<StrategySignal[]> {
    const signals: StrategySignal[] = [];
    const params = strategy.parameters as any;

    // Example strategy evaluation (customize based on your strategy types)
    switch (strategy.name) {
      case 'RSI Strategy':
        signals.push(...await this.evaluateRSIStrategy(strategy, params));
        break;
      case 'Moving Average Strategy':
        signals.push(...await this.evaluateMAStrategy(strategy, params));
        break;
      // Add more strategy types here
    }

    return signals;
  }

  private async processSignal(signal: StrategySignal) {
    try {
      const orderRequest: OrderRequest = {
        symbol: signal.symbol,
        side: signal.signal,
        type: 'LIMIT',
        quantity: signal.quantity,
        price: signal.price
      };

      const order = await this.deltaClient.executeSignal(orderRequest);

      // Record the trade
      await this.dbService.recordTrade(
        this.userId,
        this.sessionId,
        signal.strategy.id,
        orderRequest,
        signal.price
      );

      // Create notification
      await this.createNotification({
        type: 'TRADE_EXECUTED',
        strategyId: signal.strategy.id,
        details: {
          symbol: signal.symbol,
          side: signal.signal,
          price: signal.price,
          quantity: signal.quantity,
          orderId: order.id
        }
      });

    } catch (error) {
      console.error('Error processing signal:', error);
      await this.createNotification({
        type: 'TRADE_FAILED',
        strategyId: signal.strategy.id,
        details: {
          symbol: signal.symbol,
          side: signal.signal,
          price: signal.price,
          quantity: signal.quantity,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  private async createNotification(notification: {
    type: string;
    strategyId: string;
    details: any;
  }) {
    try {
      await this.dbService.createNotification(
        this.userId,
        notification.type,
        notification.strategyId,
        notification.details
      );
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // Strategy evaluation methods
  private async evaluateRSIStrategy(strategy: Strategy, params: any): Promise<StrategySignal[]> {
    // Implement RSI strategy logic here
    return [];
  }

  private async evaluateMAStrategy(strategy: Strategy, params: any): Promise<StrategySignal[]> {
    // Implement Moving Average strategy logic here
    return [];
  }

  getActiveStrategies(): Strategy[] {
    return Array.from(this.activeStrategies.values());
  }
} 