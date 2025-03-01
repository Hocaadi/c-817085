import { DeltaExchangeClient } from '@/trading/core/DeltaExchangeClient';
import { DatabaseService } from './database.service';
import { Strategy } from '@/lib/supabase';
import { toast } from '@/hooks/useToast';
import { createStrategy, STRATEGY_TYPES } from '@/trading/strategies';

export class StrategyMonitor {
  private activeStrategies: Map<string, any> = new Map();
  private isMonitoring: boolean = false;
  private readonly checkIntervalMs: number = 5000;

  constructor(
    private readonly deltaClient: DeltaExchangeClient,
    private readonly dbService: DatabaseService,
    private readonly userId: string,
    private readonly sessionId: string
  ) {
    console.log('[StrategyMonitor] Initialized with session:', sessionId);
  }

  public getDeltaClient(): DeltaExchangeClient {
    return this.deltaClient;
  }

  async addStrategy(strategy: Strategy): Promise<void> {
    try {
      console.log('[StrategyMonitor] Adding strategy:', strategy.name);

      // Create strategy instance
      const strategyInstance = createStrategy(
        strategy.type as any, // We'll need to ensure strategy.type matches STRATEGY_TYPES
        this.deltaClient,
        strategy,
        strategy.symbol || 'bitcoin' // Default to bitcoin if no symbol specified
      );

      // Store the strategy instance
      this.activeStrategies.set(strategy.id, strategyInstance);

      // Update database
      await this.dbService.updateStrategyMetrics(strategy.id, {
        ...strategy.performance_metrics,
        lastActivated: new Date().toISOString()
      });

      console.log('[StrategyMonitor] Strategy added successfully:', strategy.name);
      
      // If monitoring is already active, start the strategy
      if (this.isMonitoring) {
        await strategyInstance.start();
      }

      toast({
        title: "Strategy Added",
        description: `Now monitoring ${strategy.name}`
      });
    } catch (error) {
      console.error('[StrategyMonitor] Failed to add strategy:', error);
      toast({
        variant: "destructive",
        title: "Strategy Error",
        description: `Failed to add strategy: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      throw error;
    }
  }

  async removeStrategy(strategyId: string): Promise<void> {
    try {
      console.log('[StrategyMonitor] Removing strategy:', strategyId);
      
      const strategyInstance = this.activeStrategies.get(strategyId);
      if (strategyInstance) {
        // Stop the strategy
        strategyInstance.stop();
        this.activeStrategies.delete(strategyId);

        // Update database
        const strategy = await this.dbService.getStrategy(strategyId);
        if (strategy) {
          await this.dbService.updateStrategyMetrics(strategyId, {
            ...strategy.performance_metrics,
            lastDeactivated: new Date().toISOString()
          });
        }

        toast({
          title: "Strategy Removed",
          description: "Strategy has been stopped and removed"
        });
      }
    } catch (error) {
      console.error('[StrategyMonitor] Failed to remove strategy:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove strategy"
      });
      throw error;
    }
  }

  async startMonitoring(): Promise<void> {
    try {
      console.log('[StrategyMonitor] Starting monitoring');
      
      // Initialize Delta Exchange client
      await this.deltaClient.startStrategy();
      
      this.isMonitoring = true;

      // Start all active strategies
      for (const [id, strategy] of this.activeStrategies) {
        try {
          await strategy.start();
        } catch (error) {
          console.error(`[StrategyMonitor] Failed to start strategy ${id}:`, error);
        }
      }

      toast({
        title: "Monitoring Started",
        description: `Actively monitoring ${this.activeStrategies.size} strategies`
      });
    } catch (error) {
      this.isMonitoring = false;
      console.error('[StrategyMonitor] Failed to start monitoring:', error);
      toast({
        variant: "destructive",
        title: "Monitoring Failed",
        description: error instanceof Error ? error.message : "Failed to start monitoring"
      });
      throw error;
    }
  }

  stopMonitoring(): void {
    console.log('[StrategyMonitor] Stopping all monitoring');
    
    this.isMonitoring = false;
    
    // Stop all active strategies
    for (const strategy of this.activeStrategies.values()) {
      strategy.stop();
    }
    
    this.deltaClient.stopStrategy();
    
    toast({
      title: "Monitoring Stopped",
      description: "All strategy monitoring has been stopped"
    });
  }

  getActiveStrategies(): Strategy[] {
    return Array.from(this.activeStrategies.keys()).map(id => 
      this.activeStrategies.get(id).strategy
    );
  }
} 