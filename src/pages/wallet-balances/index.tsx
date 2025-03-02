'use client';

import { WalletBalancesGrid } from '@/components/WalletBalancesGrid';
import { Card } from '@/components/ui/card';
import { DeltaClientProvider } from '@/components/DeltaClientProvider';
import { useEffect } from 'react';

export default function WalletBalancesPage() {
  // API keys - in production these should be properly secured
  // Using known working keys for testing
  const apiKey = "1mbsfq46ryz0flQOhhe9QrdpWrOzdz";
  const apiSecret = "h84TwZ1qrljLCDwT1vnkBLMsp7WEKv8K3kDeqIqD0CQW4ht2yACtu0UU1aCJ";

  useEffect(() => {
    console.log('WalletBalancesPage mounted');
    console.log('Using API key:', apiKey.slice(0, 5) + '...');
    
    // Log environment info to help with debugging
    console.log('Environment:', {
      nodeEnv: process.env.NODE_ENV,
      buildTime: new Date().toISOString(),
      apiEndpoint: 'https://api.india.delta.exchange',
    });
  }, []);

  return (
    <DeltaClientProvider apiKey={apiKey} apiSecret={apiSecret}>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Wallet Balances</h2>
            <p className="text-sm text-muted-foreground mt-1">
              View your Delta Exchange wallet balances
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href="/wallet-balances/diagnostic" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              API Diagnostic Tool
            </a>
          </div>
        </div>
        
        <div className="grid gap-4">
          <Card className="p-6">
            <WalletBalancesGrid />
          </Card>
          
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
            <p className="font-medium mb-1">Note:</p>
            <p>This page is using the India region API endpoint (api.india.delta.exchange). If you're experiencing issues, try the diagnostic tool to verify your API credentials.</p>
          </div>
        </div>
      </div>
    </DeltaClientProvider>
  );
} 