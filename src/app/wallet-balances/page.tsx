'use client';

import { WalletBalancesGrid } from "@/components/WalletBalancesGrid";
import { DeltaClientProvider } from "@/components/DeltaClientProvider";

export default function WalletBalancesPage() {
  // Get API keys - in production these should be properly secured
  const apiKey = "1mbsfq46ryz0flQOhhe9QrdpWrOzdz";
  const apiSecret = "h84TwZ1qrljLCDwT1vnkBLMsp7WEKv8K3kDeqIqD0CQW4ht2yACtu0UU1aCJ";
  
  return (
    <DeltaClientProvider apiKey={apiKey} apiSecret={apiSecret}>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Wallet Balances</h1>
        <WalletBalancesGrid />
      </div>
    </DeltaClientProvider>
  );
} 