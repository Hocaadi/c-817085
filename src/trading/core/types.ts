export interface Position {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  quantity: number;
  stopLoss?: {
    price: number;
    type: 'FIXED' | 'TRAILING';
    trailingPercent?: number;
  };
  takeProfit?: number;
  timestamp: number;
  strategy: string;
  pnl: number;
  status: 'OPEN' | 'CLOSED';
}

export interface OrderRequest {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  quantity: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  strategy?: string;
}

export interface RiskMetrics {
  currentDrawdown: number;
  maxDrawdown: number;
  totalEquity: number;
  exposurePercentage: number;
} 