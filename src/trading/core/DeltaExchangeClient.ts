import axios, { AxiosError } from 'axios';
import * as CryptoJS from 'crypto-js';
import { OrderRequest } from './types';
import { toast } from '@/hooks/useToast';

export class DeltaExchangeClient {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl: string;
  private isInitialized: boolean = false;

  constructor(apiKey: string, apiSecret: string, testMode: boolean = false) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = testMode 
      ? 'https://testnet-api.delta.exchange/v2'
      : 'https://api.delta.exchange/v2';
  }

  private generateSignature(timestamp: string, method: string, path: string, body: string = ''): string {
    const message = `${timestamp}${method}${path}${body}`;
    return CryptoJS.HmacSHA256(message, this.apiSecret).toString(CryptoJS.enc.Hex);
  }

  private handleError(error: unknown, context: string) {
    let errorMessage = 'An unknown error occurred';
    
    if (error instanceof AxiosError) {
      errorMessage = error.response?.data?.message || error.message;
      
      toast({
        variant: "destructive",
        title: `${context} Error`,
        description: errorMessage,
      });
    } else if (error instanceof Error) {
      errorMessage = error.message;
      
      toast({
        variant: "destructive",
        title: `${context} Error`,
        description: errorMessage,
      });
    }
    
    throw new Error(`${context}: ${errorMessage}`);
  }

  private async makeRequest(method: string, endpoint: string, data?: any) {
    try {
      const timestamp = Date.now().toString();
      const path = `/v2${endpoint}`;
      const signature = this.generateSignature(
        timestamp,
        method,
        path,
        data ? JSON.stringify(data) : ''
      );

      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        data,
        headers: {
          'api-key': this.apiKey,
          'timestamp': timestamp,
          'signature': signature,
          'Content-Type': 'application/json'
        },
        validateStatus: (status) => status < 500
      });

      if (response.status >= 400) {
        throw new Error(response.data.message || 'API request failed');
      }

      return response.data;
    } catch (error) {
      this.handleError(error, 'API Request');
    }
  }

  async placeOrder(orderRequest: OrderRequest) {
    try {
      const payload = {
        symbol: orderRequest.symbol,
        side: orderRequest.side,
        type: orderRequest.type,
        size: orderRequest.quantity,
        price: orderRequest.price,
        limit_price: orderRequest.price,
        stop_price: orderRequest.stopLoss,
        time_in_force: 'GTC'
      };

      return await this.makeRequest('POST', '/orders', payload);
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }

  async cancelOrder(orderId: string) {
    try {
      return await this.makeRequest('DELETE', `/orders/${orderId}`);
    } catch (error) {
      console.error('Error canceling order:', error);
      throw error;
    }
  }

  async getPositions() {
    try {
      const response = await this.makeRequest('GET', '/positions');
      return response.result || [];
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }
  }

  async getProductDetails(symbol: string) {
    try {
      const response = await this.makeRequest('GET', `/products/${symbol}`);
      return response.result;
    } catch (error) {
      console.error('Error fetching product details:', error);
      throw error;
    }
  }

  async getBalance() {
    try {
      const response = await this.makeRequest('GET', '/wallet/balances');
      return response.result || [];
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.makeRequest('GET', '/time');
      this.isInitialized = true;
      
      toast({
        title: "Connection Successful",
        description: "Successfully connected to Delta Exchange",
      });
      
      return true;
    } catch (error) {
      this.isInitialized = false;
      this.handleError(error, 'Connection Check');
      return false;
    }
  }
} 