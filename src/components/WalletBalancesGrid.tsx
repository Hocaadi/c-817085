import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeltaClient } from './DeltaClientProvider';

interface Balance {
  currency: string;
  available_balance: string;
  total_balance: string;
  locked_balance: string;
  status: string;
}

export function WalletBalancesGrid() {
  const client = useDeltaClient();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAndFetch = async () => {
      try {
        setLoading(true);
        
        // Initialize client if not already initialized
        if (!isInitialized) {
          await client.startStrategy();
          setIsInitialized(true);
        }
        
        const response = await client.getBalance();
        setBalances(response);
        setError(null);
      } catch (err) {
        console.error('Error fetching balances:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch balances');
      } finally {
        setLoading(false);
      }
    };

    initializeAndFetch();
  }, [client, isInitialized]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Balances</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Currency</TableHead>
              <TableHead>Available Balance</TableHead>
              <TableHead>Total Balance</TableHead>
              <TableHead>Locked Balance</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {balances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No balances found
                </TableCell>
              </TableRow>
            ) : (
              balances.map((balance, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{balance.currency}</TableCell>
                  <TableCell>{balance.available_balance}</TableCell>
                  <TableCell>{balance.total_balance}</TableCell>
                  <TableCell>{balance.locked_balance}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={balance.status === 'Success' ? 'default' : 'secondary'}
                    >
                      {balance.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 