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
        
        if (!clientRef.current) {
          clientRef.current = new DeltaExchangeClient(apiKey, apiSecret);
        }
        
        // Initialize the client
        await clientRef.current.startStrategy();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize Delta client:', err);
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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