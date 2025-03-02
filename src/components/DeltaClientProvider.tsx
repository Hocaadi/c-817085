import { createContext, useContext, ReactNode, useRef, useEffect, useState } from 'react';
import { DeltaExchangeClient } from '@/trading/core/DeltaExchangeClient';
import { Loader2 } from 'lucide-react';

const DeltaClientContext = createContext<DeltaExchangeClient | null>(null);

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
  const clientRef = useRef<DeltaExchangeClient | null>(null);
  
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = new DeltaExchangeClient(apiKey, apiSecret);
    }
    setIsLoading(false);
  }, [apiKey, apiSecret]);
  
  if (isLoading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <DeltaClientContext.Provider value={clientRef.current}>
      {children}
    </DeltaClientContext.Provider>
  );
} 