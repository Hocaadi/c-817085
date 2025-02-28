import axios from 'axios';
import crypto from 'crypto';

export class DeltaExchangeClient {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl: string = 'https://api.delta.exchange/v2';

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  private generateSignature(timestamp: string, method: string, path: string, body: string = ''): string {
    const message = `${timestamp}${method}${path}${body}`;
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(message)
      .digest('hex');
  }

  private async makeRequest(method: string, endpoint: string, data?: any) {
    const timestamp = Date.now().toString();
    const signature = this.generateSignature(timestamp, method, endpoint, JSON.stringify(data || ''));

    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        data,
        headers: {
          'api-key': this.apiKey,
          'timestamp': timestamp,
          'signature': signature,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Delta Exchange API Error:', error);
      throw error;
    }
  }

  async placeOrder(orderRequest: OrderRequest) {
    return this.makeRequest('POST', '/orders', orderRequest);
  }

  async cancelOrder(orderId: string) {
    return this.makeRequest('DELETE', `/orders/${orderId}`);
  }

  async getPositions() {
    return this.makeRequest('GET', '/positions');
  }
} 