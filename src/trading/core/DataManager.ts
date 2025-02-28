import axios from 'axios';

export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class DataManager {
  private cache: Map<string, Map<string, CandleData[]>> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getCandles(symbol: string, timeframe: string, limit: number = 100): Promise<CandleData[]> {
    const cacheKey = `${symbol}-${timeframe}`;
    const cachedData = this.cache.get(cacheKey)?.get('data');
    const lastUpdate = this.cache.get(cacheKey)?.get('lastUpdate')?.[0]?.timestamp;

    if (cachedData && lastUpdate && Date.now() - lastUpdate < this.CACHE_DURATION) {
      return cachedData;
    }

    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${symbol}/ohlc`,
        {
          params: {
            vs_currency: 'usd',
            days: this.getDaysFromTimeframe(timeframe)
          }
        }
      );

      const candles = this.formatCandleData(response.data);
      this.updateCache(cacheKey, candles);
      return candles;
    } catch (error) {
      console.error('Error fetching candle data:', error);
      throw error;
    }
  }

  private getDaysFromTimeframe(timeframe: string): number {
    const map = {
      '1m': 1,
      '5m': 1,
      '15m': 1,
      '1h': 7,
      '4h': 14,
      '1d': 30,
      '1w': 90
    };
    return map[timeframe] || 30;
  }

  private formatCandleData(data: any[]): CandleData[] {
    return data.map(([timestamp, open, high, low, close, volume]) => ({
      timestamp,
      open,
      high,
      low,
      close,
      volume
    }));
  }

  private updateCache(key: string, data: CandleData[]): void {
    if (!this.cache.has(key)) {
      this.cache.set(key, new Map());
    }
    this.cache.get(key).set('data', data);
    this.cache.get(key).set('lastUpdate', [{ timestamp: Date.now() }]);
  }
} 