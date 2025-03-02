import { createContext, useContext, ReactNode, useRef } from 'react';
import { DeltaExchangeClient } from '@/trading/core/DeltaExchangeClient';

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
  // Use ref to maintain the same client instance across renders
  const clientRef = useRef<DeltaExchangeClient | null>(null);
  
  if (!clientRef.current) {
    clientRef.current = new DeltaExchangeClient(apiKey, apiSecret);
  }
  
  return (
    <DeltaClientContext.Provider value={clientRef.current}>
      {children}
    </DeltaClientContext.Provider>
  );
} 