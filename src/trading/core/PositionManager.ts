import { Position, OrderRequest, RiskMetrics } from './types';
import { DeltaExchangeClient } from './DeltaExchangeClient';

export class PositionManager {
  private positions: Map<string, Position> = new Map();
  private readonly maxDrawdown: number = 20; // 20%
  private readonly deltaClient: DeltaExchangeClient;
  private isConnected: boolean = false;

  constructor(apiKey: string, apiSecret: string) {
    this.deltaClient = new DeltaExchangeClient(apiKey, apiSecret);
  }

  async initializeConnection() {
    try {
      this.isConnected = await this.deltaClient.startStrategy();
    } catch (error) {
      console.error('Error initializing Delta Exchange connection:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async openPosition(request: OrderRequest): Promise<Position> {
    if (!this.isConnected) {
      throw new Error('Not connected to Delta Exchange API');
    }

    try {
      // Check risk metrics before opening position
      const metrics = this.calculateRiskMetrics();
      if (metrics.currentDrawdown >= this.maxDrawdown) {
        throw new Error('Max drawdown limit reached');
      }

      const order = await this.deltaClient.executeSignal(request);
      const position: Position = {
        id: order.id,
        symbol: request.symbol,
        side: request.side === 'BUY' ? 'LONG' : 'SHORT',
        entryPrice: order.price,
        quantity: request.quantity,
        stopLoss: request.stopLoss ? {
          price: request.stopLoss,
          type: 'FIXED'
        } : undefined,
        takeProfit: request.takeProfit,
        timestamp: Date.now(),
        strategy: request.strategy || 'unknown',
        pnl: 0,
        status: 'OPEN'
      };

      this.positions.set(position.id, position);
      return position;
    } catch (error) {
      console.error('Error opening position:', error);
      throw error;
    }
  }

  async closePosition(positionId: string): Promise<void> {
    const position = this.positions.get(positionId);
    if (!position || position.status === 'CLOSED') {
      throw new Error('Position not found or already closed');
    }

    const closeRequest: OrderRequest = {
      symbol: position.symbol,
      side: position.side === 'LONG' ? 'SELL' : 'BUY',
      type: 'MARKET',
      quantity: position.quantity
    };

    await this.deltaClient.executeSignal(closeRequest);
    position.status = 'CLOSED';
    this.positions.set(positionId, position);
  }

  private calculateRiskMetrics(): RiskMetrics {
    let totalEquity = 0;
    let totalExposure = 0;
    let maxDrawdown = 0;

    this.positions.forEach(position => {
      if (position.status === 'OPEN') {
        totalExposure += position.quantity * position.entryPrice;
        totalEquity += position.pnl;
      }
    });

    const currentDrawdown = totalEquity < 0 ? (Math.abs(totalEquity) / totalExposure) * 100 : 0;

    return {
      currentDrawdown,
      maxDrawdown: this.maxDrawdown,
      totalEquity,
      exposurePercentage: (totalExposure / totalEquity) * 100
    };
  }

  async updatePositions(): Promise<void> {
    interface DeltaPosition {
      id: string;
      unrealized_pnl: number;
    }

    const positions = await this.deltaClient.getPositions() as DeltaPosition[];
    positions.forEach((position: DeltaPosition) => {
      const existingPosition = this.positions.get(position.id);
      if (existingPosition) {
        existingPosition.pnl = position.unrealized_pnl;
        this.positions.set(position.id, existingPosition);
      }
    });
  }

  getOpenPositions(): Position[] {
    return Array.from(this.positions.values()).filter(p => p.status === 'OPEN');
  }

  async killSwitch(mode: 'PREVENT_NEW' | 'CLOSE_ALL' | 'BOTH'): Promise<void> {
    if (mode === 'CLOSE_ALL' || mode === 'BOTH') {
      const openPositions = this.getOpenPositions();
      await Promise.all(openPositions.map(p => this.closePosition(p.id)));
    }
    if (mode === 'PREVENT_NEW' || mode === 'BOTH') {
      this.deltaClient.stopStrategy();
      this.isConnected = false;
    }
  }
} 