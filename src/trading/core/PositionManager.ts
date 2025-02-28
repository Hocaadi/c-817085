import { Position, OrderRequest, RiskMetrics } from './types';
import { DeltaExchangeClient } from './DeltaExchangeClient';

export class PositionManager {
  private positions: Map<string, Position> = new Map();
  private readonly maxDrawdown: number = 20; // 20%
  private readonly deltaClient: DeltaExchangeClient;

  constructor(apiKey: string, apiSecret: string) {
    this.deltaClient = new DeltaExchangeClient(apiKey, apiSecret);
  }

  async openPosition(request: OrderRequest): Promise<Position> {
    // Check risk metrics before opening position
    const metrics = this.calculateRiskMetrics();
    if (metrics.currentDrawdown >= this.maxDrawdown) {
      throw new Error('Max drawdown limit reached');
    }

    const order = await this.deltaClient.placeOrder(request);
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
      strategy: request.strategy,
      pnl: 0,
      status: 'OPEN'
    };

    this.positions.set(position.id, position);
    return position;
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

    await this.deltaClient.placeOrder(closeRequest);
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
    const positions = await this.deltaClient.getPositions();
    positions.forEach(position => {
      if (this.positions.has(position.id)) {
        const existingPosition = this.positions.get(position.id);
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
  }
} 