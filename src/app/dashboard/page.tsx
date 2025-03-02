'use client';

import { WalletBalancesGrid } from "@/components/WalletBalancesGrid";
import { ProductsGrid } from "@/components/ProductsGrid";
import { DeltaClientProvider } from "@/components/DeltaClientProvider";
import { DELTA_EXCHANGE_CREDENTIALS } from '@/config/api-credentials';

export default function DashboardPage() {
  // Get API keys from centralized configuration
  const { apiKey, apiSecret } = DELTA_EXCHANGE_CREDENTIALS;

  return (
    <DeltaClientProvider apiKey={apiKey} apiSecret={apiSecret}>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ProductsGrid showTradingControls={true} />
          <WalletBalancesGrid />
        </div>
      </div>
    </DeltaClientProvider>
  );
} 