import axios from 'axios';
import { DeltaExchangeClient, OrderType, OrderSide, TimeInForce } from '../core/DeltaExchangeClient';
import { Strategy } from '@/lib/supabase';
import { toast } from '@/hooks/useToast';

interface CandleData {
  timestamp: number;
  high: number;
  low: number;
  open: number;
  close: number;
  volume: number;
}

export class AdarshBullStrategy {
  private lastCandles: CandleData[] = [];
  private isRunning: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly symbol: string;
  private readonly timeframeMs: number = 60000; // 1 minute
  private readonly requiredCandles: number = 2;

  constructor(
    private readonly deltaClient: DeltaExchangeClient,
    private readonly strategy: Strategy,
    symbol: string
  ) {
    this.symbol = symbol;
    console.log(`[AdarshBull] Initializing strategy for ${symbol}`);
  }

  async start(): Promise<void> {
    try {
      console.log(`[AdarshBull] Starting strategy for ${this.symbol}`);
      
      // Initial data fetch
      await this.fetchAndUpdateCandles();
      
      // Start monitoring
      this.isRunning = true;
      this.startMonitoring();
      
      toast({
        title: "Strategy Started",
        description: `Adarsh Bull Strategy started for ${this.symbol}`
      });
    } catch (error) {
      console.error('[AdarshBull] Failed to start strategy:', error);
      this.handleError('Strategy Start Failed', error);
      throw error;
    }
  }

  stop(): void {
    console.log(`[AdarshBull] Stopping strategy for ${this.symbol}`);
    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async fetchAndUpdateCandles(): Promise<void> {
    try {
      console.log(`[AdarshBull] Fetching candle data for ${this.symbol}`);
      
      // Fetch data from CoinGecko
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${this.symbol}/ohlc?vs_currency=usd&days=1`
      );
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response from CoinGecko');
      }

      // Process and store last 2 candles
      const candles: CandleData[] = response.data
        .slice(-this.requiredCandles)
        .map(([timestamp, open, high, low, close]: number[]) => ({
          timestamp,
          open,
          high,
          low,
          close,
          volume: 0 // CoinGecko doesn't provide volume in OHLC
        }));

      console.log(`[AdarshBull] Processed ${candles.length} candles`);
      console.log('[AdarshBull] Latest candles:', JSON.stringify(candles, null, 2));

      this.lastCandles = candles;
    } catch (error) {
      console.error('[AdarshBull] Error fetching candle data:', error);
      this.handleError('Data Fetch Failed', error);
      throw error;
    }
  }

  private async checkSignalCondition(): Promise<boolean> {
    if (this.lastCandles.length < this.requiredCandles) {
      console.log('[AdarshBull] Insufficient candle data for signal generation');
      return false;
    }

    const [previousCandle, currentCandle] = this.lastCandles;
    const isSignalValid = currentCandle.high > previousCandle.high;

    console.log('[AdarshBull] Signal check:', {
      previousHigh: previousCandle.high,
      currentHigh: currentCandle.high,
      isSignalValid
    });

    return isSignalValid;
  }

  private async executeSignal(): Promise<void> {
    try {
      console.log('[AdarshBull] Executing buy signal');
      
      // Get product ID for the symbol
      const productId = await this.deltaClient.getProductId(this.symbol);
      console.log(`[AdarshBull] Retrieved product ID: ${productId}`);

      // Calculate order parameters
      const currentPrice = this.lastCandles[this.lastCandles.length - 1].close;
      const orderSize = 1; // Define your position size logic here

      // Place the order
      const orderResponse = await this.deltaClient.placeOrder({
        product_id: productId,
        size: orderSize,
        side: OrderSide.BUY,
        order_type: OrderType.LIMIT,
        limit_price: currentPrice.toString(),
        time_in_force: TimeInForce.GTC
      });

      console.log('[AdarshBull] Order placed successfully:', orderResponse);
      
      toast({
        title: "Order Placed",
        description: `Buy order placed for ${this.symbol} at ${currentPrice}`
      });
    } catch (error) {
      console.error('[AdarshBull] Failed to execute signal:', error);
      this.handleError('Order Execution Failed', error);
      throw error;
    }
  }

  private startMonitoring(): void {
    this.checkInterval = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        console.log(`[AdarshBull] Checking signals for ${this.symbol}`);
        
        // Update candle data
        await this.fetchAndUpdateCandles();
        
        // Check for signal
        const hasSignal = await this.checkSignalCondition();
        
        if (hasSignal) {
          console.log('[AdarshBull] Buy signal detected, executing order');
          await this.executeSignal();
        }
      } catch (error) {
        console.error('[AdarshBull] Error in monitoring loop:', error);
        this.handleError('Monitoring Error', error);
      }
    }, this.timeframeMs);
  }

  private handleError(context: string, error: any): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`[AdarshBull] ${context}:`, errorMessage);
    
    toast({
      variant: "destructive",
      title: context,
      description: errorMessage
    });
  }
} 