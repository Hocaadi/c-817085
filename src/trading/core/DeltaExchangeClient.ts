import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import * as CryptoJS from 'crypto-js';
import { toast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT'
}

export enum TimeInForce {
  GTC = 'GTC', // Good till cancelled
  IOC = 'IOC', // Immediate or cancel
  FOK = 'FOK'  // Fill or kill
}

export enum OrderSide {
  BUY = 'buy',
  SELL = 'sell'
}

export interface OrderRequest {
  product_id: number;
  size: number;
  side: OrderSide;
  limit_price?: string;
  stop_price?: string;
  trail_amount?: string;
  order_type?: OrderType;
  time_in_force?: TimeInForce;
  post_only?: boolean;
  isTrailingStopLoss?: boolean;
}

export class DeltaExchangeClient {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl: string = 'https://api.india.delta.exchange';
  private isInitialized: boolean = false;
  private isStrategyActive: boolean = false;
  private serverTimeOffset: number = 0;
  private lastServerTime: number = 0;
  private lastTimeUpdate: number = 0;
  private readonly timeEndpoint: string = '/v2/time';  // Updated time endpoint

  constructor(apiKey: string, apiSecret: string) {
    if (!apiKey || !apiSecret) {
      throw new Error('API key and secret are required');
    }
    
    // Remove any whitespace from credentials
    this.apiKey = apiKey.trim();
    this.apiSecret = apiSecret.trim();
    
    console.log('[DeltaExchange] Initialized client with API key:', this.apiKey.slice(0, 5) + '...');
  }

  private generateSignature(method: string, timestamp: string, path: string): string {
    // ✅ Match Python exactly: METHOD + TIMESTAMP + PATH
    const message = `${method}${timestamp}${path}`;
    
    // Debug info matching Python output exactly
    console.log('\n🔹 Debug Info:');
    console.log(`  - Timestamp: ${timestamp}`);
    console.log(`  - Method: ${method}`);
    console.log(`  - Path: ${path}`);
    console.log(`  - Message for HMAC: '${message}'`);
    
    // ✅ Match Python's hmac.new(key.encode('utf-8'), message.encode('utf-8'), hashlib.sha256).hexdigest()
    const hmac = CryptoJS.HmacSHA256(
      message,  // message as is (CryptoJS handles UTF-8 encoding)
      this.apiSecret  // secret as is (CryptoJS handles UTF-8 encoding)
    );
    
    const signature = hmac.toString(CryptoJS.enc.Hex);
    console.log(`🔹 Generated Signature: ${signature}`);
    
    return signature;
  }

  private async getServerTime(): Promise<number> {
    try {
      // Get server time from products endpoint as fallback since /time is not working
      const response = await axios.get(`${this.baseUrl}/v2/products`);
      if (response.data && response.data.result && response.data.result.length > 0) {
        const now = Math.floor(Date.now() / 1000);
        // Use server time from response headers or current time
        const serverTime = parseInt(response.headers['x-delta-server-time']) || now;
        
        // Update offset
        this.serverTimeOffset = serverTime - now;
        this.lastServerTime = serverTime;
        this.lastTimeUpdate = Date.now();
        
        console.log(`Server time sync:`, {
          serverTime,
          localTime: now,
          offset: this.serverTimeOffset
        });
        
        // Add 1 second buffer to ensure signature doesn't expire
        return serverTime + 1;
      }
    } catch (error) {
      console.warn('Failed to sync server time:', error);
    }
    
    // Fallback: Use local time + any known offset + buffer
    const timestamp = Math.floor(Date.now() / 1000) + this.serverTimeOffset + 1;
    console.log('Using local time with offset:', timestamp);
    return timestamp;
  }

  private async makeRequestWithRetry(config: AxiosRequestConfig, retries: number = 3): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Request attempt ${attempt}/${retries}`);
        const response = await axios(config);
        return response;
      } catch (error) {
        if (
          axios.isAxiosError(error) && 
          error.response?.data?.error?.code === 'expired_signature' &&
          attempt < retries
        ) {
          console.log(`Signature expired on attempt ${attempt}, retrying...`);
          // Update timestamp and signature for next attempt
          const newTimestamp = (await this.getServerTime()).toString();
          const newSignature = this.generateSignature(
            config.method?.toUpperCase() || 'GET',
            newTimestamp,
            new URL(config.url || '').pathname
          );
          
          config.headers = {
            ...config.headers,
            'timestamp': newTimestamp,
            'signature': newSignature
          };
          
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }

  async startStrategy(): Promise<boolean> {
    try {
      // Verify authentication by checking wallet balance directly
      const walletResponse = await this.makeRequest('GET', '/v2/wallet/balances', null, false);
      if (!walletResponse || !walletResponse.result) {
        throw new Error('Failed to authenticate with Delta Exchange');
      }
      
      this.isInitialized = true;
      this.isStrategyActive = true;
      
      toast({
        title: "Strategy Started",
        description: "Successfully connected to Delta Exchange"
      });
      
      return true;
    } catch (error) {
      this.isInitialized = false;
      this.isStrategyActive = false;
      
      let errorMessage = 'Failed to connect to Delta Exchange';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (axios.isAxiosError(error) && error.response) {
        errorMessage = `API Error: ${error.response.status} - ${error.response.statusText}`;
      }
      
      toast({
        variant: "destructive",
        title: "Strategy Start Failed",
        description: errorMessage
      });
      
      throw new Error(errorMessage);
    }
  }

  stopStrategy() {
    this.isStrategyActive = false;
    this.isInitialized = false;
    toast({
      title: "Strategy Stopped",
      description: "Trading strategy has been deactivated"
    });
  }

  private checkStrategyActive() {
    if (!this.isStrategyActive || !this.isInitialized) {
      throw new Error('Cannot execute trade: Strategy is not active');
    }
  }

  private async createNotification(title: string, description: string, type: 'success' | 'error' | 'info' = 'info') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            title,
            description,
            type,
            user_id: user?.id,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Failed to create notification:', error);
      }

      // Show toast regardless of Supabase success
      toast({
        title,
        description,
        variant: type === 'error' ? 'destructive' : 'default'
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      // Still show toast even if Supabase fails
      toast({
        title,
        description,
        variant: type === 'error' ? 'destructive' : 'default'
      });
    }
  }

  private async makeRequest(method: string, endpoint: string, data?: any, requiresStrategy: boolean = true) {
    if (requiresStrategy) {
      this.checkStrategyActive();
    }

    console.log('\n📡 DEBUG: API Request');
    console.log('========================================');
    
    try {
      // Step 1: Get timestamp with server time sync
      const timestamp = (await this.getServerTime()).toString();
      
      // Step 2: Clean path and prepare request
      const path = endpoint.startsWith('/v2') ? endpoint : `/v2${endpoint}`;
      console.log('\nRequest Setup:');
      console.log(`  Method: ${method.toUpperCase()}`);
      console.log(`  Path: ${path}`);
      console.log(`  Timestamp: ${timestamp}`);
      
      // Step 3: Generate signature
      const signature = this.generateSignature(
        method.toUpperCase(),
        timestamp,
        path
      );
      
      // Step 4: Construct request
      const config: AxiosRequestConfig = {
        method: method.toUpperCase(),
        url: `${this.baseUrl}${path}`,
        headers: {
          'api-key': this.apiKey,
          'timestamp': timestamp,
          'signature': signature,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      };

      if (data && method !== 'GET') {
        config.data = JSON.stringify(data);
      }

      // Step 5: Make request with retries
      const response = await this.makeRequestWithRetry(config);
      
      // Step 6: Update time offset from response headers if available
      if (response.headers['x-delta-server-time']) {
        const serverTime = parseInt(response.headers['x-delta-server-time']);
        const localTime = Math.floor(Date.now() / 1000);
        this.serverTimeOffset = serverTime - localTime;
        this.lastServerTime = serverTime;
        this.lastTimeUpdate = Date.now();
      }
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;
        console.error('\n❌ Error Details:');
        console.error(`  Status: ${axiosError.response?.status}`);
        console.error(`  Error Code: ${axiosError.response?.data?.error?.code}`);
        console.error(`  Request Time: ${axiosError.response?.data?.error?.context?.request_time}`);
        console.error(`  Server Time: ${axiosError.response?.data?.error?.context?.server_time}`);
        
        // Update time offset if we get server time in error
        if (axiosError.response?.data?.error?.context?.server_time) {
          const serverTime = axiosError.response.data.error.context.server_time;
          const localTime = Math.floor(Date.now() / 1000);
          this.serverTimeOffset = serverTime - localTime;
          this.lastServerTime = serverTime;
          this.lastTimeUpdate = Date.now();
          console.log('Updated time offset from error response:', this.serverTimeOffset);
        }
        
        // Return empty result for GET requests if they fail
        if (method === 'GET') {
          console.log('Returning empty result for failed GET request');
          return { success: false, result: [], message: 'Failed to fetch data' };
        }
        
        throw error;
      }
      throw error;
    }
  }

  async placeOrder(orderRequest: OrderRequest) {
    this.checkStrategyActive();
    
    const payload = {
      product_id: orderRequest.product_id,
      size: orderRequest.size,
      side: orderRequest.side,
      order_type: orderRequest.order_type || OrderType.LIMIT,
      time_in_force: orderRequest.time_in_force || TimeInForce.GTC,
      ...(orderRequest.limit_price && { limit_price: orderRequest.limit_price }),
      ...(orderRequest.post_only !== undefined && { post_only: orderRequest.post_only })
    };

    return this.makeRequest('POST', '/orders', payload);
  }

  async placeStopOrder(orderRequest: OrderRequest) {
    this.checkStrategyActive();
    
    if (!orderRequest.stop_price && !orderRequest.trail_amount) {
      throw new Error('Either stop_price or trail_amount must be provided for stop orders');
    }

    const payload = {
      product_id: orderRequest.product_id,
      size: orderRequest.size,
      side: orderRequest.side,
      order_type: orderRequest.order_type || OrderType.LIMIT,
      time_in_force: orderRequest.time_in_force || TimeInForce.GTC,
      ...(orderRequest.limit_price && { limit_price: orderRequest.limit_price }),
      ...(orderRequest.stop_price && { stop_price: orderRequest.stop_price }),
      ...(orderRequest.trail_amount && { 
        trail_amount: orderRequest.trail_amount,
        isTrailingStopLoss: true
      })
    };

    return this.makeRequest('POST', '/orders', payload);
  }

  async cancelOrder(productId: number, orderId: number) {
    this.checkStrategyActive();
    return this.makeRequest('DELETE', `/orders/${orderId}?product_id=${productId}`);
  }

  async batchCreateOrders(productId: number, orders: OrderRequest[]) {
    this.checkStrategyActive();
    
    if (orders.length > 5) {
      throw new Error('Maximum 5 orders allowed in batch creation');
    }

    const payload = {
      product_id: productId,
      orders: orders.map(order => ({
        size: order.size,
        side: order.side,
        order_type: order.order_type || OrderType.LIMIT,
        time_in_force: order.time_in_force || TimeInForce.GTC,
        ...(order.limit_price && { limit_price: order.limit_price })
      }))
    };

    return this.makeRequest('POST', '/batch_orders', payload);
  }

  async batchCancelOrders(productId: number, orderIds: number[]) {
    this.checkStrategyActive();
    
    if (orderIds.length > 5) {
      throw new Error('Maximum 5 orders allowed in batch cancellation');
    }

    const payload = {
      product_id: productId,
      order_ids: orderIds
    };

    return this.makeRequest('DELETE', '/batch_orders', payload);
  }

  async setLeverage(productId: number, leverage: number) {
    this.checkStrategyActive();
    
    const payload = {
      product_id: productId,
      leverage: leverage
    };

    return this.makeRequest('POST', '/leverage', payload);
  }

  async getProductId(symbol: string): Promise<number> {
    const products = await this.makeRequest('GET', '/products', null, false);
    const product = products.result.find((p: any) => p.symbol === symbol);
    if (!product) {
      throw new Error(`Product not found for symbol: ${symbol}`);
    }
    return product.id;
  }

  async getPositions() {
    this.checkStrategyActive();
    const response = await this.makeRequest('GET', '/positions');
    return response.result || [];
  }

  async getBalance() {
    this.checkStrategyActive();
    try {
      const response = await this.makeRequest('GET', '/v2/wallet/balances', null);
      
      // Handle case where we get partial or no data
      if (!response || !response.result) {
        return [{
          currency: 'USDT',
          available_balance: '0',
          total_balance: '0',
          locked_balance: '0',
          status: 'Error fetching balance'
        }];
      }
      
      // Map whatever data we can get
      return response.result.map((balance: any) => ({
        currency: balance.currency || 'Unknown',
        available_balance: balance.available_balance || '0',
        total_balance: balance.total_balance || '0',
        locked_balance: balance.locked_balance || '0',
        status: response.success ? 'Success' : 'Partial data'
      }));
    } catch (error) {
      console.error('[DeltaExchange] Failed to fetch wallet balances:', error);
      // Return a default structure even on error
      return [{
        currency: 'USDT',
        available_balance: '0',
        total_balance: '0',
        locked_balance: '0',
        status: 'Error: ' + (error instanceof Error ? error.message : 'Unknown error')
      }];
    }
  }

  async getMarkets() {
    return this.makeRequest('GET', '/products', null, false);
  }

  async getProductDetails(symbol: string) {
    return this.makeRequest('GET', `/products/${symbol}`, null, false);
  }
} 