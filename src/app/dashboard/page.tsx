'use client';

import { WalletBalancesGrid } from "@/components/WalletBalancesGrid";
import { ProductsGrid } from "@/components/ProductsGrid";
import { DeltaClientProvider } from "@/components/DeltaClientProvider";

export default function DashboardPage() {
  // Get API keys from environment variables
  const apiKey = process.env.NEXT_PUBLIC_DELTA_API_KEY || '';
  const apiSecret = process.env.NEXT_PUBLIC_DELTA_API_SECRET || '';
  
  return (
    <DeltaClientProvider apiKey={apiKey} apiSecret={apiSecret}>
      <div className="container mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <WalletBalancesGrid />
        <ProductsGrid />
      </div>
    </DeltaClientProvider>
  );
} 