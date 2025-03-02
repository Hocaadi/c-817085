/**
 * API Credentials Configuration
 * 
 * IMPORTANT: 
 * - This is a development-only solution
 * - For production, use environment variables with proper security measures
 * - Never commit actual API keys to version control
 */

// Delta Exchange API credentials
export const DELTA_EXCHANGE_CREDENTIALS = {
  apiKey: "1mbsfq46ryz0flQOhhe9QrdpWrOzdz",
  apiSecret: "h84TwZ1qrljLCDwT1vnkBLMsp7WEKv8K3kDeqIqD0CQW4ht2yACtu0UU1aCJ",
  baseUrl: "https://api.india.delta.exchange",
};

// Helper function to check if credentials are valid
export const hasValidDeltaCredentials = (): boolean => {
  return Boolean(
    DELTA_EXCHANGE_CREDENTIALS.apiKey && 
    DELTA_EXCHANGE_CREDENTIALS.apiSecret
  );
};

// For future support of multiple exchanges/credential sets
export const getCredentialsForService = (serviceName: string) => {
  switch(serviceName.toLowerCase()) {
    case 'delta':
    case 'deltaexchange':
      return DELTA_EXCHANGE_CREDENTIALS;
    default:
      throw new Error(`No credentials available for service: ${serviceName}`);
  }
}; 