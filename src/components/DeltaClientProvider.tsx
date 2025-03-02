import { createContext, useContext, ReactNode, useRef, useEffect, useState } from 'react';
import { DeltaExchangeClient } from '@/trading/core/DeltaExchangeClient';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface DeltaClientContextValue {
  client: DeltaExchangeClient | null;
  isInitialized: boolean;
  error: string | null;
}

const DeltaClientContext = createContext<DeltaClientContextValue | null>(null);

export function useDeltaClient() {
  const context = useContext(DeltaClientContext);
  if (!context) {
    throw new Error('useDeltaClient must be used within a DeltaClientProvider');
  }
  return context;
}

interface DeltaClientProviderProps {
  apiKey: string;
  apiSecret: string;
  children: ReactNode;
}

export function DeltaClientProvider({ apiKey, apiSecret, children }: DeltaClientProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<DeltaExchangeClient | null>(null);
  
  useEffect(() => {
    const initializeClient = async (retryAttempt = 0, maxRetries = 4) => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`[DeltaClientProvider] Initializing client (attempt ${retryAttempt + 1}/${maxRetries + 1})...`);
        
        // Create a new client instance or update credentials if they changed
        if (!clientRef.current || 
            clientRef.current.getApiKey() !== apiKey || 
            clientRef.current.getApiSecret() !== apiSecret) {
          console.log('[DeltaClientProvider] Creating new client instance');
          
          // Use India endpoint by default
          clientRef.current = new DeltaExchangeClient(
            apiKey, 
            apiSecret, 
            'https://api.india.delta.exchange'
          );
          
          // No time sync needed
        }
        
        // Verify API credentials
        console.log('[DeltaClientProvider] Verifying API credentials...');
        
        // Add a progressive buffer based on retry attempt
        // This helps account for possible time differences with the server
        const additionalBuffer = retryAttempt * 20; // Add 20 seconds more buffer for each retry
        console.log(`[DeltaClientProvider] Using additional time buffer: +${additionalBuffer}s for timestamp`);
        
        const verificationResult = await clientRef.current.verifyApiCredentials(additionalBuffer);
        
        if (!verificationResult.valid) {
          throw new Error(`API Verification Failed: ${verificationResult.message}`);
        }
        
        console.log('[DeltaClientProvider] API credentials verified successfully');
        
        // Initialize the strategy if verification was successful
        await clientRef.current.startStrategy();
        setIsInitialized(true);
        console.log('[DeltaClientProvider] Client initialized successfully');
      } catch (err) {
        console.error(`[DeltaClientProvider] Failed to initialize Delta client (attempt ${retryAttempt + 1}/${maxRetries + 1}):`, err);
        
        // Check if error is due to expired signature and we haven't exceeded max retries
        if (err instanceof Error && 
            (err.message.includes('expired_signature') || 
             err.message.includes('Signature expired')) &&
            retryAttempt < maxRetries) {
          
          // Wait a short time before retrying (increase delay with each retry)
          const retryDelay = 1000 * (retryAttempt + 1);
          console.log(`[DeltaClientProvider] Retrying initialization in ${retryDelay/1000}s due to signature expiration...`);
          
          setTimeout(() => {
            initializeClient(retryAttempt + 1, maxRetries);
          }, retryDelay);
          
          // Don't set error or finish loading yet, since we're retrying
          return;
        }
        
        // If we've exhausted retries or it's a different error, set the error and finish loading
        setError(err instanceof Error ? err.message : 'Failed to initialize client');
        setIsLoading(false);
      } finally {
        // Only set loading to false if we're not retrying
        if (isLoading && !error) {
          setIsLoading(false);
        }
      }
    };
    
    initializeClient();
  }, [apiKey, apiSecret]);
  
  if (isLoading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Connecting to Delta Exchange...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="bg-destructive/10 border border-destructive rounded-md p-4 max-w-xl">
          <h3 className="text-lg font-medium text-destructive mb-2">Connection Error</h3>
          <p className="text-sm">{error}</p>
          <p className="text-xs mt-2">Please check your API credentials and try again.</p>
          
          <div className="mt-4 bg-background/50 p-3 rounded-sm text-xs">
            <p className="font-semibold mb-1">Troubleshooting Tips:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Verify your API key and secret are correct for the India region</li>
              <li>Ensure you have a stable internet connection</li>
              <li>Confirm the Delta Exchange API is operational</li>
              <li>Try reducing the frequency of requests if you encounter expired signatures</li>
              {error?.includes('Signature expired') && (
                <li className="text-amber-600 font-medium">
                  Network latency detected: Delta Exchange requires signatures to reach their servers within 5 seconds
                </li>
              )}
            </ul>
            
            {error?.includes('Signature expired') && (
              <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-sm">
                <p className="font-medium text-amber-800 mb-1">Advanced Solutions:</p>
                <ul className="list-disc pl-4 space-y-1 text-amber-700">
                  <li>Try reloading the page</li>
                  <li>If on a cellular or slow connection, try switching to a faster network</li>
                  <li>Disable browser extensions that might be intercepting network requests</li>
                  <li>Try a different browser or device if the issue persists</li>
                  <li>Check for any firewalls or proxies that might be introducing delays</li>
                </ul>
              </div>
            )}
            
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-sm">
              <p className="font-medium text-blue-800">Technical Information:</p>
              <p className="text-blue-700 text-xs mt-1">
                Delta Exchange API requires requests to have signatures that are received within 5 seconds of their generation. 
                We've implemented automatic retries with progressive buffers (up to 5 attempts with increasing time buffers) to help overcome network latency issues.
              </p>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Reload Page
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <DeltaClientContext.Provider value={{
      client: clientRef.current,
      isInitialized,
      error
    }}>
      {children}
    </DeltaClientContext.Provider>
  );
} 