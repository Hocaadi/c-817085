import { useEffect, useState } from 'react';
import { DeltaExchangeClient } from '@/trading/core/DeltaExchangeClient';
import { toast } from '@/hooks/useToast';

const DELTA_API_KEY = '1mbsfq46ryz0flQOhhe9QrdpWrOzdz';
const DELTA_API_SECRET = 'h84TwZ1qrljLCDwT1vnkBLMsp7WEKv8K3kDeqIqD0CQW4ht2yACtu0UU1aCJ';

export default function WalletBalances() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAndFetchBalances = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize Delta Exchange client
        const deltaClient = new DeltaExchangeClient(DELTA_API_KEY, DELTA_API_SECRET);
        
        // Start the strategy (this will also fetch wallet balances)
        await deltaClient.startStrategy();
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to fetch wallet balances:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch wallet balances');
        setIsLoading(false);
        
        toast({
          variant: "destructive",
          title: "Error",
          description: err instanceof Error ? err.message : 'Failed to fetch wallet balances'
        });
      }
    };

    initializeAndFetchBalances();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-destructive text-lg">Failed to load wallet balances</div>
        <div className="text-sm text-muted-foreground">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Wallet Balances</h1>
        <p className="text-muted-foreground">
          Your wallet balances will appear here. The notifications above show your current portfolio status.
        </p>
      </div>
    </div>
  );
} 