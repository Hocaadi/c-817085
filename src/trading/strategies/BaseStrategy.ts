import { DataManager, CandleData } from '../core/DataManager';
import { PositionManager } from '../core/PositionManager';
import { OrderRequest } from '../core/types';

export interface StrategyConfig {
  symbol: string;
  timeframes: string[];
  stopLossType: 'FIXED' | 'TRAILING';
  stopLossValue: number;
  takeProfitValue?: number;
  quantity: number;
}

export abstract class BaseStrategy {
  protected dataManager: DataManager;
  protected positionManager: PositionManager;
  protected config: StrategyConfig;
  protected isActive: boolean = false;

  constructor(
    dataManager: DataManager,
    positionManager: PositionManager,
    config: StrategyConfig
  ) {
    this.dataManager = dataManager;
    this.positionManager = positionManager;
    this.config = config;
  }

  abstract analyze(candles: Map<string, CandleData[]>): Promise<{
    signal: 'BUY' | 'SELL' | 'NEUTRAL';
    reason: string;
  }>;

  async execute(): Promise<void> {
    if (!this.isActive) return;

    try {
      // Fetch data for all timeframes
      const candleData = new Map();
      for (const timeframe of this.config.timeframes) {
        const candles = await this.dataManager.getCandles(
          this.config.symbol,
          timeframe
        );
        candleData.set(timeframe, candles);
      }

      // Analyze and get signal
      const { signal, reason } = await this.analyze(candleData);

      if (signal !== 'NEUTRAL') {
        const orderRequest: OrderRequest = {
          symbol: this.config.symbol,
          side: signal === 'BUY' ? 'BUY' : 'SELL',
          type: 'MARKET',
          quantity: this.config.quantity,
          stopLoss: this.calculateStopLoss(signal, candleData),
          takeProfit: this.calculateTakeProfit(signal, candleData)
        };

        await this.positionManager.openPosition(orderRequest);
      }
    } catch (error) {
      console.error('Strategy execution error:', error);
      throw error;
    }
  }

  protected calculateStopLoss(signal: 'BUY' | 'SELL', candleData: Map<string, CandleData[]>): number {
    const latestCandle = candleData.get(this.config.timeframes[0])[0];
    const stopLossPercent = this.config.stopLossValue / 100;

    if (this.config.stopLossType === 'FIXED') {
      return signal === 'BUY'
        ? latestCandle.close * (1 - stopLossPercent)
        : latestCandle.close * (1 + stopLossPercent);
    }

    // For trailing stop-loss, initial stop-loss is same as fixed
    return this.calculateStopLoss(signal, candleData);
  }

  protected calculateTakeProfit(signal: 'BUY' | 'SELL', candleData: Map<string, CandleData[]>): number {
    if (!this.config.takeProfitValue) return null;

    const latestCandle = candleData.get(this.config.timeframes[0])[0];
    const takeProfitPercent = this.config.takeProfitValue / 100;

    return signal === 'BUY'
      ? latestCandle.close * (1 + takeProfitPercent)
      : latestCandle.close * (1 - takeProfitPercent);
  }

  start(): void {
    this.isActive = true;
  }

  stop(): void {
    this.isActive = false;
  }

  isRunning(): boolean {
    return this.isActive;
  }
} 