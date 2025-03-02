import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeltaClient } from '@/components/DeltaClientProvider';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Balance {
  currency: string;
  available_balance: string;
  total_balance: string;
  locked_balance: string;
  status: string;
}

export function WalletBalancesGrid() {
  const { client, isInitialized, error: clientError } = useDeltaClient();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchBalances = async () => {
    if (!client) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching wallet balances (attempt ${retryCount + 1})...`);
      
      // We no longer need to explicitly call forceSyncTime here as it's handled in the client
      
      const response = await client.getBalance();
      console.log('Wallet balances response:', response);
      
      if (response && response.length > 0) {
        setBalances(response);
        
        // Log successful loading of balances
        const totalBalance = response.reduce((sum: number, balance: Balance) => {
          return sum + parseFloat(balance.total_balance || '0');
        }, 0);
        
        console.log(`Successfully loaded ${response.length} wallet balances totaling $${totalBalance.toFixed(2)}`);
      } else {
        setError('No balances returned from API');
        console.error('Empty or invalid response from wallet balances API');
      }
    } catch (err) {
      console.error('Error fetching wallet balances:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Auto-retry with exponential backoff to avoid hammering the API
      if (retryCount < 2) {
        const delayMs = Math.min(2000 * Math.pow(2, retryCount), 10000); // Exponential backoff with max 10s
        console.log(`Auto-retrying in ${delayMs/1000} seconds (attempt ${retryCount + 2})...`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, delayMs);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!client || !isInitialized) {
      return;
    }

    fetchBalances();
  }, [client, isInitialized, retryCount]);

  const handleRetry = () => {
    setRetryCount(count => count + 1);
    console.log('Manually retrying wallet balance fetch...');
  };

  if (clientError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet Balances</CardTitle>
          <CardDescription>There was an error initializing the client</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <div>Error: {clientError}</div>
            </div>
            <div className="text-sm text-muted-foreground mt-2 mb-4">
              <p>Please check:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>Your API keys are correct and have appropriate permissions</li>
                <li>Your internet connection is stable</li>
                <li>Delta Exchange API services are operational</li>
              </ul>
            </div>
            <Button variant="outline" onClick={handleRetry} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading || !isInitialized) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet Balances</CardTitle>
          <CardDescription>Loading your account balances...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
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
          <CardDescription>There was an error retrieving your balances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <div>Error: {error}</div>
            </div>
            <div className="text-sm text-muted-foreground mt-2 mb-4">
              <p>This may be due to:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>API key permissions issue</li>
                <li>Network connectivity problems</li>
                <li>Server-side issues at Delta Exchange</li>
                <li>Time synchronization issues between your system and Delta servers</li>
              </ul>
            </div>
            <Button variant="outline" onClick={handleRetry} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Wallet Balances</CardTitle>
          <CardDescription>Your available balance across different currencies</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setRetryCount(prev => prev + 1);
          }}
          disabled={loading}
        >
          {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
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