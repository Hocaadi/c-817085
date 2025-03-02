import { createContext, useContext, ReactNode, useRef, useEffect, useState } from 'react';
import { DeltaExchangeClient } from '@/trading/core/DeltaExchangeClient';
import { Loader2 } from 'lucide-react';

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
    const initializeClient = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('[DeltaClientProvider] Initializing client...');
        
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
        }
        
        // Verify API credentials first
        console.log('[DeltaClientProvider] Verifying API credentials...');
        const verificationResult = await clientRef.current.verifyApiCredentials();
        
        if (!verificationResult.valid) {
          throw new Error(`API Verification Failed: ${verificationResult.message}`);
        }
        
        console.log('[DeltaClientProvider] API credentials verified successfully');
        
        // Initialize the strategy if verification was successful
        await clientRef.current.startStrategy();
        setIsInitialized(true);
        console.log('[DeltaClientProvider] Client initialized successfully');
      } catch (err) {
        console.error('[DeltaClientProvider] Failed to initialize Delta client:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize client');
      } finally {
        setIsLoading(false);
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