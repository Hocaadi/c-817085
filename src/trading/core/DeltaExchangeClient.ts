import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import * as CryptoJS from 'crypto-js';
import { toast } from '@/hooks/useToast';

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
  private readonly baseUrl: string = 'https://api.delta.exchange';
  private isInitialized: boolean = false;
  private isStrategyActive: boolean = false;
  private readonly defaultHeaders: Record<string, string>;

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.defaultHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': this.apiKey
    };
  }

  private generateSignature(timestamp: string, method: string, requestPath: string, body: string = ''): string {
    const message = `${timestamp}${method}${requestPath}${body}`;
    const signature = CryptoJS.HmacSHA256(message, this.apiSecret).toString(CryptoJS.enc.Hex);
    
    console.log('[DeltaExchange] Signature generation:', {
      timestamp,
      method,
      path: requestPath,
      bodyLength: body.length,
      messagePreview: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
      signaturePreview: signature.slice(0, 10) + '...'
    });
    
    return signature;
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

  private async makeRequest(method: string, endpoint: string, data?: any, requiresStrategy: boolean = true) {
    if (requiresStrategy) {
      this.checkStrategyActive();
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const requestPath = endpoint.startsWith('/v2') ? endpoint : `/v2${endpoint}`;
      const body = data ? JSON.stringify(data) : '';
      
      // Generate signature according to Delta Exchange specs
      const signature = this.generateSignature(timestamp, method.toUpperCase(), requestPath, body);

      const config: AxiosRequestConfig = {
        method: method,
        url: `${this.baseUrl}${requestPath}`,
        headers: {
          'api-key': this.apiKey,
          'timestamp': timestamp,
          'signature': signature,
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      console.log('[DeltaExchange] Request:', {
        method: config.method,
        url: config.url,
        timestamp,
        headers: {
          ...config.headers,
          'api-key': '***',
          'signature': '***'
        },
        data: config.data ? JSON.stringify(config.data) : undefined
      });

      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        console.error('[DeltaExchange] Request failed:', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          requestConfig: {
            method: axiosError.config?.method,
            url: axiosError.config?.url,
            headers: axiosError.config?.headers,
            data: axiosError.config?.data
          }
        });
        
        const errorMessage = axiosError.response?.data?.message || axiosError.message;
        
        if (requiresStrategy) {
          toast({
            variant: "destructive",
            title: "API Error",
            description: `Request failed: ${errorMessage}`
          });
        }
        
        throw new Error(`API Error: ${errorMessage}`);
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
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch wallet balances');
      }
      return response.result.map((balance: any) => ({
        currency: balance.currency,
        available_balance: balance.available_balance,
        total_balance: balance.total_balance,
        locked_balance: balance.locked_balance
      }));
    } catch (error) {
      console.error('[DeltaExchange] Failed to fetch wallet balances:', error);
      throw error;
    }
  }

  async getMarkets() {
    return this.makeRequest('GET', '/products', null, false);
  }

  async getProductDetails(symbol: string) {
    return this.makeRequest('GET', `/products/${symbol}`, null, false);
  }
} 