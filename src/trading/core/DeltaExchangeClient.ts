import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import * as CryptoJS from 'crypto-js';
import { OrderRequest } from './types';
import { toast } from '@/hooks/useToast';

export class DeltaExchangeClient {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl: string = 'https://api.india.delta.exchange';
  private isInitialized: boolean = false;
  private isStrategyActive: boolean = false;
  private readonly defaultHeaders: Record<string, string>;
  private clientIp: string = '';

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.defaultHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': this.apiKey
    };
    this.initializeIp();
  }

  private async initializeIp() {
    try {
      const response = await axios.get('https://api.ipify.org?format=json');
      this.clientIp = response.data.ip;
      console.log('Client IP:', this.clientIp);
      
      // Add IP to default headers
      this.defaultHeaders['X-Forwarded-For'] = this.clientIp;
    } catch (error) {
      console.error('Failed to get IP address:', error);
      toast({
        variant: "destructive",
        title: "IP Detection Failed",
        description: "Could not determine client IP address"
      });
    }
  }

  private generateSignature(timestamp: string, method: string, requestPath: string, body: string = ''): string {
    const message = `${timestamp}${method.toUpperCase()}${requestPath}${body}`;
    return CryptoJS.HmacSHA256(message, this.apiSecret).toString(CryptoJS.enc.Hex);
  }

  async startStrategy(): Promise<boolean> {
    try {
      // Only make the connection check when explicitly starting the strategy
      const response = await this.makeRequest('GET', '/time', null, false);
      this.isInitialized = true;
      this.isStrategyActive = true;
      
      toast({
        title: "Strategy Started",
        description: `Successfully connected to Delta Exchange India (${this.clientIp})`
      });
      
      return true;
    } catch (error) {
      this.isInitialized = false;
      this.isStrategyActive = false;
      if (error instanceof Error) {
        toast({
          variant: "destructive",
          title: "Strategy Start Failed",
          description: error.message
        });
      }
      throw error;
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
      const requestPath = `/v2${endpoint}`;
      const body = data ? JSON.stringify(data) : '';
      const signature = this.generateSignature(timestamp, method, requestPath, body);

      const config: AxiosRequestConfig = {
        method: method,
        url: `${this.baseUrl}${requestPath}`,
        headers: {
          ...this.defaultHeaders,
          'timestamp': timestamp,
          'signature': signature
        },
        validateStatus: (status) => status >= 200 && status < 300
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const errorMessage = axiosError.response?.data?.message || axiosError.message;
        
        toast({
          variant: "destructive",
          title: "API Error",
          description: `Request failed: ${errorMessage}`
        });
        
        throw new Error(`API Error: ${errorMessage}`);
      }
      throw error;
    }
  }

  async executeSignal(orderRequest: OrderRequest) {
    this.checkStrategyActive();
    
    const payload = {
      symbol: orderRequest.symbol,
      side: orderRequest.side.toUpperCase(),
      type: orderRequest.type.toUpperCase(),
      size: orderRequest.quantity,
      price: orderRequest.price,
      limit_price: orderRequest.price,
      stop_price: orderRequest.stopLoss,
      time_in_force: 'GTC',
      post_only: false
    };

    return this.makeRequest('POST', '/orders', payload);
  }

  async cancelOrder(orderId: string) {
    this.checkStrategyActive();
    return this.makeRequest('DELETE', `/orders/${orderId}`);
  }

  async getPositions() {
    this.checkStrategyActive();
    const response = await this.makeRequest('GET', '/positions');
    return response.result || [];
  }

  async getBalance() {
    this.checkStrategyActive();
    const response = await this.makeRequest('GET', '/wallet/balances');
    return response.result || [];
  }

  // These methods are only used when setting up the strategy, not during active trading
  async getMarkets() {
    return this.makeRequest('GET', '/products', null, false);
  }

  async getProductDetails(symbol: string) {
    return this.makeRequest('GET', `/products/${symbol}`, null, false);
  }

  getClientIp(): string {
    return this.clientIp;
  }
} 