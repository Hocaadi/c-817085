'use client';

import { WalletBalancesGrid } from '@/components/WalletBalancesGrid';
import { Card } from '@/components/ui/card';
import { DeltaClientProvider } from '@/components/DeltaClientProvider';

export default function WalletBalancesPage() {
  // Get API keys - in production these should be properly secured
  const apiKey = "1mbsfq46ryz0flQOhhe9QrdpWrOzdz";
  const apiSecret = "h84TwZ1qrljLCDwT1vnkBLMsp7WEKv8K3kDeqIqD0CQW4ht2yACtu0UU1aCJ";

  return (
    <DeltaClientProvider apiKey={apiKey} apiSecret={apiSecret}>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Wallet Balances</h2>
        </div>
        <div className="grid gap-4">
          <Card className="p-6">
            <WalletBalancesGrid />
          </Card>
        </div>
      </div>
    </DeltaClientProvider>
  );
} 