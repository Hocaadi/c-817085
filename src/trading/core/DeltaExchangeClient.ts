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
  private readonly baseUrl: string;
  private isInitialized: boolean = false;
  private isStrategyActive: boolean = false;
  private serverTimeOffset: number = 0;
  private lastTimeSync: number = 0;

  constructor(apiKey: string, apiSecret: string, baseUrl: string = 'https://api.india.delta.exchange') {
    if (!apiKey || !apiSecret) {
      throw new Error('API key and secret are required');
    }
    
    this.apiKey = apiKey.trim();
    this.apiSecret = apiSecret.trim();
    this.baseUrl = baseUrl.trim();
    
    console.log(`[DeltaExchange] Initialized client with API endpoint: ${this.baseUrl}`);
    console.log(`[DeltaExchange] Using API key: ${this.apiKey.substring(0, 4)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
  }

  /**
   * Get masked API key for comparison and debugging
   */
  public getApiKey(): string {
    return this.apiKey;
  }
  
  /**
   * Get masked API secret for comparison and debugging
   */
  public getApiSecret(): string {
    return this.apiSecret;
  }
  
  /**
   * Get the base URL for the API
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Generates a signature exactly matching the Python implementation
   */
  private generateSignature(method: string, timestamp: string, path: string): string {
    // ✅ Exactly match the Python implementation format: METHOD + TIMESTAMP + PATH
    const message = `${method}${timestamp}${path}`;
    
    // Debug info (same as Python debug)
    console.log('\n🔹 Debug Info:');
    console.log(`  - Timestamp: ${timestamp}`);
    console.log(`  - Method: ${method}`);
    console.log(`  - Path: ${path}`);
    console.log(`  - Message for HMAC: '${message}'`);
    
    // ✅ Generate HMAC signature using SHA256 (same as Python)
    const hmac = CryptoJS.HmacSHA256(
      message,
      this.apiSecret
    );
    
    const signature = hmac.toString(CryptoJS.enc.Hex);
    console.log(`🔹 Generated Signature: ${signature}`);
    
    return signature;
  }

  /**
   * Gets the current timestamp with server time offset adjustment
   */
  private getTimestamp(): string {
    // Get local time in seconds (ensure it's an integer)
    const localTime = Math.floor(Date.now() / 1000);
    
    // Apply the server time offset to synchronize with Delta Exchange server time
    const adjustedTime = Math.floor(localTime + this.serverTimeOffset);
    
    // Ensure we return only an integer as string with no decimal places
    const timestamp = adjustedTime.toString();
    console.log(`🕒 Using timestamp: ${timestamp} (local: ${localTime}, offset: ${this.serverTimeOffset})`);
    return timestamp;
  }

  /**
   * Sync time with the server to ensure our timestamps are valid
   * This should be called before making authenticated requests
   */
  public async syncServerTime(): Promise<void> {
    try {
      // Only sync if we haven't done so in the last 5 minutes (reduced from 30 mins)
      const now = Date.now();
      if (now - this.lastTimeSync < 5 * 60 * 1000 && this.serverTimeOffset !== 0) {
        console.log('[DeltaExchange] Using existing time offset:', this.serverTimeOffset);
        return;
      }

      const localTime = Math.floor(Date.now() / 1000);
      console.log('[DeltaExchange] Current local timestamp:', localTime);
      
      // Use the correct endpoint for server time
      const response = await axios.get(`${this.baseUrl}/v2/time`);
      if (response.data && response.data.result) {
        // Ensure server time is an integer
        const serverTime = Math.floor(response.data.result.server_time);
        this.serverTimeOffset = serverTime - localTime;
        this.lastTimeSync = now;
        
        console.log('[DeltaExchange] Server time:', serverTime);
        console.log('[DeltaExchange] Local time:', localTime);
        console.log('[DeltaExchange] Calculated offset:', this.serverTimeOffset, 'seconds');
        
        if (Math.abs(this.serverTimeOffset) > 10) {
          console.warn(`[DeltaExchange] ⚠️ Significant time difference of ${this.serverTimeOffset} seconds detected`);
        } else {
          console.log('[DeltaExchange] ✅ Time difference is within acceptable range');
        }
      }
    } catch (error) {
      console.error('[DeltaExchange] Error fetching server time:', error);
      // If we can't reach the server, don't change the existing offset
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  public async forceSyncTime(): Promise<void> {
    return this.syncServerTime();
  }

  private async makeRequestWithRetry(config: AxiosRequestConfig, retries: number = 3): Promise<any> {
    // Ensure time is synced before making authenticated requests
    await this.syncServerTime();
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[DeltaExchange] Request attempt ${attempt}/${retries}:`, config.url);
        
        // For debugging
        if (attempt === 1) {
          console.log('[DeltaExchange] Request headers:', JSON.stringify(config.headers, null, 2));
        }
        
        const response = await axios(config);
        
        // Log success for debugging
        console.log(`[DeltaExchange] Request successful (${response.status})`);
        
        return response;
      } catch (error) {
        if (!axios.isAxiosError(error)) {
          console.error('[DeltaExchange] Non-Axios error:', error);
          throw error;
        }
        
        // Extract error details for better debugging
        const statusCode = error.response?.status;
        const errorCode = error.response?.data?.error?.code;
        const errorMessage = error.response?.data?.error?.message;
        
        console.error(`[DeltaExchange] Error: ${statusCode} - ${errorCode} - ${errorMessage}`);
        console.error('[DeltaExchange] Full error response:', JSON.stringify(error.response?.data, null, 2));
        
        // Handle specific error types
        const isExpiredSignature = statusCode === 401 && errorCode === 'expired_signature';
        const isInvalidApiKey = statusCode === 401 && errorCode === 'invalid_api_key';
        
        if (isInvalidApiKey) {
          console.error('[DeltaExchange] ❌ Invalid API key detected. Please check your credentials.');
          console.error(`[DeltaExchange] API Key used: ${config.headers?.['api-key']}`);
          // Don't retry for invalid API key - it won't succeed
          throw new Error('Invalid API key. Please check your credentials and ensure you are using the correct API key for the India region.');
        }
           
        if (isExpiredSignature && attempt < retries) {
          console.log(`[DeltaExchange] Signature expired on attempt ${attempt}, retrying with new timestamp...`);
          
          // Extract server time from error if available
          if (error.response?.data?.error?.context?.server_time) {
            const serverTime = error.response.data.error.context.server_time;
            const localTime = Math.floor(Date.now() / 1000);
            
            // Update our offset based on this error
            this.serverTimeOffset = Math.floor(serverTime - localTime);
            console.log(`[DeltaExchange] Updated time offset to ${this.serverTimeOffset} based on error`);
          } else {
            // Force a re-sync with server time
            await this.syncServerTime();
          }
          
          // Generate a fresh timestamp with updated offset
          const newTimestamp = this.getTimestamp();
          
          // Extract path from URL for signature generation
          const url = new URL(config.url || '');
          const path = url.pathname;
          
          // Generate new signature with the fresh timestamp
          const newSignature = this.generateSignature(
            config.method?.toUpperCase() || 'GET',
            newTimestamp,
            path
          );
          
          // Update headers
          config.headers = {
            ...config.headers,
            'timestamp': newTimestamp,
            'signature': newSignature
          };
          
          // Log updated headers
          console.log('[DeltaExchange] Updated request headers:', JSON.stringify(config.headers, null, 2));
          
          // Add a short delay to ensure server time advances
          await new Promise(resolve => setTimeout(resolve, 1500));
          continue;
        }
        
        if (attempt === retries) {
          console.error(`[DeltaExchange] Max retries (${retries}) exceeded for request to ${config.url}`);
        }
        
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }

  private async makeRequest(method: string, endpoint: string, data?: any, requiresStrategy: boolean = true) {
    if (requiresStrategy) {
      this.checkStrategyActive();
    }

    console.log('\n📡 DEBUG: API Request');
    console.log('========================================');
    console.log(`🔑 Using API Key: ${this.apiKey.substring(0, 4)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
    console.log(`🌐 Base URL: ${this.baseUrl}`);
    
    try {
      // Ensure time is synchronized
      await this.syncServerTime();
      
      // Ensure endpoint is properly formatted
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      
      // Standardize path format - ensure it has /v2 prefix for most endpoints
      // But don't add it if it's already there
      const fullPath = path.startsWith('/v2') ? path : `/v2${path}`;
      
      console.log(`📍 Endpoint: ${fullPath}`);
      
      // Get timestamp with server offset applied
      const timestamp = this.getTimestamp();
      
      // Generate signature with method, timestamp, and path only
      const signature = this.generateSignature(
        method.toUpperCase(),
        timestamp,
        fullPath
      );
      
      // Construct request with the exact headers required by Delta Exchange
      const config: AxiosRequestConfig = {
        method: method.toUpperCase(),
        url: `${this.baseUrl}${fullPath}`,
        headers: {
          'api-key': this.apiKey,
          'timestamp': timestamp,
          'signature': signature,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      };

      if (data) {
        if (method.toUpperCase() === 'GET') {
          config.params = data;
        } else {
          config.data = JSON.stringify(data);
        }
      }

      console.log(`[DeltaExchange] Making ${method.toUpperCase()} request to ${fullPath}`);
      
      // Make request with retries
      const response = await this.makeRequestWithRetry(config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;
        console.error('\n❌ Error Details:');
        console.error(`  Status: ${axiosError.response?.status}`);
        console.error(`  Error Code: ${axiosError.response?.data?.error?.code}`);
        console.error(`  Message: ${axiosError.response?.data?.error?.message || axiosError.message}`);
        
        if (axiosError.response?.data?.error?.context) {
          console.error(`  Request Time: ${axiosError.response?.data?.error?.context?.request_time}`);
          console.error(`  Server Time: ${axiosError.response?.data?.error?.context?.server_time}`);
          
          // If there's a time difference in the error response, update our offset
          if (axiosError.response?.data?.error?.context?.server_time && 
              axiosError.response?.data?.error?.context?.request_time) {
            const serverTime = axiosError.response.data.error.context.server_time;
            const requestTime = axiosError.response.data.error.context.request_time;
            const newOffset = serverTime - requestTime;
            
            console.log(`[DeltaExchange] Updating time offset based on error response: ${newOffset}`);
            this.serverTimeOffset = newOffset;
          }
        }
        
        // Return empty result for GET requests if they fail
        if (method.toUpperCase() === 'GET') {
          console.log('[DeltaExchange] Returning empty result for failed GET request');
          return { success: false, result: [], message: 'Failed to fetch data' };
        }
        
        throw error;
      }
      throw error;
    }
  }

  async startStrategy(): Promise<boolean> {
    try {
      // Validate API credentials format
      if (!this.apiKey || this.apiKey.length < 10) {
        throw new Error('Invalid API key format');
      }
      
      if (!this.apiSecret || this.apiSecret.length < 10) {
        throw new Error('Invalid API secret format');
      }
      
      console.log('[DeltaExchange] Validating API credentials...');
      
      // Sync time with server first
      await this.syncServerTime();
      
      // Verify authentication by checking wallet balance directly
      console.log('[DeltaExchange] Testing API connection by fetching wallet balances...');
      const walletResponse = await this.makeRequest('GET', '/v2/wallet/balances', null, false);
      
      if (!walletResponse || !walletResponse.success) {
        console.error('[DeltaExchange] API authentication failed:', walletResponse);
        throw new Error('Failed to authenticate with Delta Exchange API');
      }
      
      console.log('[DeltaExchange] API authentication successful');
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
        
        // Special handling for common API key errors
        if (error.response.status === 401) {
          if (error.response.data?.error?.code === 'invalid_api_key') {
            errorMessage = 'Invalid API key. Please check your credentials.';
          } else if (error.response.data?.error?.code === 'expired_signature') {
            errorMessage = 'Signature expired. Please check your system clock.';
          }
        }
      }
      
      console.error('[DeltaExchange] Strategy start failed:', errorMessage);
      
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
      // Log timestamp for debugging
      console.log('[DeltaExchange] Fetching wallet balances with timestamp:', this.getTimestamp());
      
      // Use exact path format for India endpoint
      const response = await this.makeRequest('GET', '/v2/wallet/balances', null);
      console.log('[DeltaExchange] Wallet balances raw response:', JSON.stringify(response, null, 2));
      
      // Handle case where we get partial or no data
      if (!response) {
        console.error('[DeltaExchange] No response data received');
        return [{
          currency: 'USDT',
          available_balance: '0',
          total_balance: '0',
          locked_balance: '0',
          status: 'Error: No response data'
        }];
      }
      
      // Check if we got an error response
      if (response.error) {
        console.error('[DeltaExchange] Error in response:', response.error);
        return [{
          currency: 'USDT',
          available_balance: '0',
          total_balance: '0',
          locked_balance: '0',
          status: `Error: ${response.error.code || 'Unknown error'}`
        }];
      }
      
      // Check if we have valid result data
      if (!response.result || !Array.isArray(response.result) || response.result.length === 0) {
        console.warn('[DeltaExchange] No balance data found in response');
        return [{
          currency: 'USDT',
          available_balance: '0',
          total_balance: '0',
          locked_balance: '0',
          status: 'No balances found'
        }];
      }
      
      // Log the successful response
      console.log(`[DeltaExchange] Successfully retrieved ${response.result.length} wallet balances`);
      
      // Map the data to our expected format
      return response.result.map((balance: any) => ({
        currency: balance.currency || 'Unknown',
        available_balance: balance.available_balance || '0',
        total_balance: balance.total_balance || '0',
        locked_balance: balance.locked_balance || '0',
        status: 'Success'
      }));
    } catch (error) {
      console.error('[DeltaExchange] Failed to fetch wallet balances:', error);
      
      // Return a fallback balance structure even in case of errors
      return [{
        currency: 'USDT',
        available_balance: '0',
        total_balance: '0',
        locked_balance: '0',
        status: error instanceof Error ? `Error: ${error.message}` : 'Unknown error'
      }];
    }
  }

  async getMarkets() {
    return this.makeRequest('GET', '/products', null, false);
  }

  async getProductDetails(symbol: string) {
    return this.makeRequest('GET', `/products/${symbol}`, null, false);
  }

  /**
   * Verify that the API key and secret are valid by making a simple authenticated request
   * This can be used to check credentials without starting the full strategy
   */
  async verifyApiCredentials(): Promise<{ valid: boolean; message: string }> {
    try {
      console.log('[DeltaExchange] Verifying API credentials...');
      
      // Check if API key and secret are provided
      if (!this.apiKey || this.apiKey.length < 10) {
        return { 
          valid: false, 
          message: 'Invalid API key format' 
        };
      }
      
      if (!this.apiSecret || this.apiSecret.length < 10) {
        return { 
          valid: false, 
          message: 'Invalid API secret format' 
        };
      }
      
      // Sync time with server first
      await this.syncServerTime();
      
      // Make a simple request to check authentication
      console.log('[DeltaExchange] Testing API authentication...');
      const response = await this.makeRequest('GET', '/v2/wallet/balances', null, false);
      
      if (!response) {
        return {
          valid: false,
          message: 'No response received from API'
        };
      }
      
      if (response.error) {
        return {
          valid: false,
          message: `API Error: ${response.error.code} - ${response.error.message}`
        };
      }
      
      // If we got a valid result, the credentials are working
      console.log('[DeltaExchange] API credentials verified successfully');
      return {
        valid: true,
        message: 'API credentials are valid'
      };
    } catch (error) {
      console.error('[DeltaExchange] API credentials verification failed:', error);
      
      let errorMessage = 'Failed to verify API credentials';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (axios.isAxiosError(error) && error.response) {
        errorMessage = `API Error: ${error.response.status}`;
        
        // Special handling for common API key errors
        if (error.response.status === 401) {
          if (error.response.data?.error?.code === 'invalid_api_key') {
            errorMessage = 'Invalid API key. Please check your credentials.';
          } else if (error.response.data?.error?.code === 'expired_signature') {
            errorMessage = 'Signature expired. This may be due to system clock issues.';
          }
        }
      }
      
      return {
        valid: false,
        message: errorMessage
      };
    }
  }
} 