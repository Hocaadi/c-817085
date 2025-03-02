import { WalletBalancesGrid } from '@/components/WalletBalancesGrid';
import { Card } from '@/components/ui/card';

export default function WalletBalancesPage() {
  return (
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
  );
} 