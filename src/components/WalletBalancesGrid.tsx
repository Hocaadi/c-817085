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
import { AlertCircle, RefreshCw, ExternalLink, TrendingUp, Wallet, ChevronDown, ChevronRight, DollarSign, IndianRupee, PieChart, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Enhanced Balance interface to include all fields from the Delta API
interface Balance {
  // Original fields
  currency: string;
  available_balance: string;
  total_balance: string;
  locked_balance: string;
  status: string;
  
  // New fields from Delta API response
  asset_id?: number;
  asset_symbol?: string;
  available_balance_for_robo?: string;
  available_balance_inr?: string;
  balance?: string;
  balance_inr?: string;
  blocked_margin?: string;
  commission?: string;
  cross_asset_liability?: string;
  cross_commission?: string;
  cross_locked_collateral?: string;
  cross_order_margin?: string;
  cross_position_margin?: string;
  id?: number;
  interest_credit?: string;
  order_margin?: string;
  pending_referral_bonus?: string;
  pending_trading_fee_credit?: string;
  portfolio_margin?: string;
  position_margin?: string;
  referral_bonus?: string;
  trading_fee_credit?: string;
  unvested_amount?: string;
  user_id?: number;
}

// Helper function to format currency values
const formatCurrency = (value: string | number, currency: string): string => {
  // Convert string to number if necessary
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // If the value is NaN or not a valid number, return a dash
  if (isNaN(numValue)) return '—';
  
  // Format the number with appropriate precision
  if (numValue === 0) return '0.00';
  
  // For very small numbers, show more decimal places
  if (numValue < 0.0001 && numValue > 0) {
    return numValue.toFixed(8);
  }
  
  // For small numbers, show 6 decimal places
  if (numValue < 0.01 && numValue > 0) {
    return numValue.toFixed(6);
  }
  
  // For medium numbers, show 4 decimal places
  if (numValue < 1 && numValue > 0) {
    return numValue.toFixed(4);
  }
  
  // Round to 2 decimal places for larger numbers
  return numValue.toFixed(2);
};

// Helper function to determine currency icon/class
const getCurrencyInfo = (currency: string) => {
  // Normalize currency to uppercase
  const normalizedCurrency = currency.toUpperCase();
  
  // Common cryptocurrencies
  const knownCurrencies: Record<string, { name: string, class: string }> = {
    'BTC': { name: 'Bitcoin', class: 'text-orange-500' },
    'ETH': { name: 'Ethereum', class: 'text-purple-500' },
    'USDT': { name: 'Tether', class: 'text-green-500' },
    'USDC': { name: 'USD Coin', class: 'text-blue-500' },
    'XRP': { name: 'Ripple', class: 'text-blue-400' },
    'SOL': { name: 'Solana', class: 'text-purple-400' },
    'DOGE': { name: 'Dogecoin', class: 'text-yellow-500' },
    'BUSD': { name: 'Binance USD', class: 'text-yellow-400' },
    'DOT': { name: 'Polkadot', class: 'text-pink-500' },
    'SHIB': { name: 'Shiba Inu', class: 'text-orange-400' },
    'MATIC': { name: 'Polygon', class: 'text-purple-600' },
    'LTC': { name: 'Litecoin', class: 'text-gray-500' },
    'AVAX': { name: 'Avalanche', class: 'text-red-500' },
    'LINK': { name: 'Chainlink', class: 'text-blue-600' },
    'XLM': { name: 'Stellar', class: 'text-blue-300' },
    'INR': { name: 'Indian Rupee', class: 'text-green-600' },
    'USD': { name: 'US Dollar', class: 'text-green-600' },
  };
  
  // Return information for known currencies, or default for unknown
  return knownCurrencies[normalizedCurrency] || { 
    name: normalizedCurrency === 'UNKNOWN' ? 'Unknown Currency' : normalizedCurrency,
    class: 'text-gray-500' 
  };
};

// Helper to map Delta Exchange fields to our existing model
const mapDeltaApiResponse = (responseData: any): Balance[] => {
  if (!responseData || !Array.isArray(responseData)) return [];

  return responseData.map(item => {
    // Determine currency from either asset_symbol or currency field
    const currency = item.asset_symbol || item.currency || 'Unknown';
    
    // Map to our Balance interface with all available fields
    return {
      // Core fields
      currency: currency,
      available_balance: item.available_balance || '0',
      total_balance: item.balance || item.total_balance || '0',
      locked_balance: item.blocked_margin || '0',
      status: 'Success',
      
      // Additional fields from Delta API
      asset_id: item.asset_id,
      asset_symbol: item.asset_symbol,
      available_balance_for_robo: item.available_balance_for_robo,
      available_balance_inr: item.available_balance_inr,
      balance: item.balance,
      balance_inr: item.balance_inr,
      blocked_margin: item.blocked_margin,
      commission: item.commission,
      cross_asset_liability: item.cross_asset_liability,
      cross_commission: item.cross_commission,
      cross_locked_collateral: item.cross_locked_collateral,
      cross_order_margin: item.cross_order_margin,
      cross_position_margin: item.cross_position_margin,
      id: item.id,
      interest_credit: item.interest_credit,
      order_margin: item.order_margin,
      pending_referral_bonus: item.pending_referral_bonus,
      pending_trading_fee_credit: item.pending_trading_fee_credit,
      portfolio_margin: item.portfolio_margin,
      position_margin: item.position_margin,
      referral_bonus: item.referral_bonus,
      trading_fee_credit: item.trading_fee_credit,
      unvested_amount: item.unvested_amount,
      user_id: item.user_id
    };
  });
};

export function WalletBalancesGrid() {
  const { client, isInitialized, error: clientError } = useDeltaClient();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  const toggleRowExpanded = (index: number) => {
    setExpandedRows(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const fetchBalances = async () => {
    if (!client) {
      setError("Client not initialized");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching wallet balances...');
      
      // Fetch balances using direct API call
      const response = await client.getBalance();
      console.log('Wallet balances response:', response);
      
      if (response && response.length > 0) {
        // Use our helper to map the Delta API response to our Balance model
        const processedBalances = mapDeltaApiResponse(response);
        
        setBalances(processedBalances);
        setLastUpdated(new Date());
        
        // Log successful loading of balances
        const totalBalance = processedBalances.reduce((sum: number, balance: Balance) => {
          return sum + parseFloat(balance.total_balance || '0');
        }, 0);
        
        console.log(`Successfully loaded ${processedBalances.length} wallet balances totaling $${totalBalance.toFixed(2)}`);
      } else {
        setError('No balances returned from API');
        console.error('Empty or invalid response from wallet balances API');
      }
    } catch (err) {
      console.error('Error fetching wallet balances:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      if (err instanceof Error) {
        // Special handling for signature expiration errors
        if (err.message.includes('expired_signature') || err.message.includes('Signature expired')) {
          setError(
            'Authentication timing issue: Signature expired before reaching Delta servers. ' +
            'This may be due to network latency. Please try again.'
          );
        }
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
  }, [client, isInitialized]);

  const handleRetry = () => {
    console.log('Manually retrying wallet balance fetch...');
    fetchBalances();
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
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2" asChild>
                <a href="https://www.india.delta.exchange/app/api-management" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Check API Keys
                </a>
              </Button>
            </div>
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
                <li>High request frequency leading to signature expiration</li>
                {error?.includes('Signature expired') && (
                  <li className="text-amber-600 font-medium">
                    Network latency causing signature expiration (Delta requires signatures to reach servers within 5 seconds)
                  </li>
                )}
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2" asChild>
                <a href="https://www.india.delta.exchange/app/api-management" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Check API Keys
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate total balance for summary
  const totalBalance = balances.reduce((sum, balance) => {
    return sum + parseFloat(balance.total_balance || '0');
  }, 0);

  // Calculate INR value if available
  const totalInrBalance = balances.reduce((sum, balance) => {
    return sum + parseFloat(balance.balance_inr || '0');
  }, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Wallet Balances
          </CardTitle>
          <CardDescription>
            Your available balance across different currencies
            {lastUpdated && (
              <span className="ml-2 text-xs text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRetry}
          disabled={loading}
          className="flex items-center gap-1"
        >
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {totalBalance > 0 && (
          <div className="mb-4 p-3 bg-primary/10 rounded-md flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-sm font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Total Balance:
                </span>
                <span className="ml-2 text-lg font-bold">{formatCurrency(totalBalance, 'USD')}</span>
              </div>
              
              {totalInrBalance > 0 && (
                <div>
                  <span className="text-sm font-medium flex items-center">
                    <IndianRupee className="h-4 w-4 mr-1" />
                    INR Value:
                  </span>
                  <span className="ml-2 text-lg font-bold">₹{formatCurrency(totalInrBalance, 'INR')}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center text-emerald-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="text-xs font-medium">Active Account</span>
            </div>
          </div>
        )}
        
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Summary View</TabsTrigger>
            <TabsTrigger value="detailed">Detailed View</TabsTrigger>
            <TabsTrigger value="margin">Margin Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Available Balance</TableHead>
                  <TableHead className="text-right">Total Balance</TableHead>
                  <TableHead className="text-right">Locked Balance</TableHead>
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
                  balances.map((balance, index) => {
                    const currencyInfo = getCurrencyInfo(balance.currency);
                    const hasBalance = parseFloat(balance.available_balance) > 0 || 
                                      parseFloat(balance.total_balance) > 0 || 
                                      parseFloat(balance.locked_balance) > 0;
                    
                    return (
                      <TableRow key={index} className={!hasBalance ? "opacity-60" : ""}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`mr-2 font-bold ${currencyInfo.class}`}>
                              {balance.currency}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {currencyInfo.name !== balance.currency ? currencyInfo.name : ''}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(balance.available_balance, balance.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(balance.total_balance, balance.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(balance.locked_balance, balance.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={balance.status === 'Success' ? 'default' : 'secondary'}
                            className={
                              balance.status === 'Success' 
                                ? 'bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/20' 
                                : ''
                            }
                          >
                            {balance.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="detailed" className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Available Balance</TableHead>
                  <TableHead className="text-right">Available in INR</TableHead>
                  <TableHead className="text-right">Total Balance</TableHead>
                  <TableHead className="text-right">Total in INR</TableHead>
                  <TableHead className="text-right">Robo Balance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No balances found
                    </TableCell>
                  </TableRow>
                ) : (
                  balances.map((balance, index) => {
                    const currencyInfo = getCurrencyInfo(balance.currency);
                    const hasBalance = parseFloat(balance.available_balance) > 0 || 
                                      parseFloat(balance.total_balance) > 0 || 
                                      parseFloat(balance.locked_balance) > 0;
                    
                    return (
                      <TableRow key={index} className={!hasBalance ? "opacity-60" : ""}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`mr-2 font-bold ${currencyInfo.class}`}>
                              {balance.currency}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {balance.asset_id || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(balance.available_balance, balance.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {balance.available_balance_inr ? `₹${formatCurrency(balance.available_balance_inr, 'INR')}` : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(balance.balance || balance.total_balance, balance.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {balance.balance_inr ? `₹${formatCurrency(balance.balance_inr, 'INR')}` : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {balance.available_balance_for_robo ? formatCurrency(balance.available_balance_for_robo, balance.currency) : '—'}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleRowExpanded(index)}
                            className="h-8 w-8 p-0"
                          >
                            {expandedRows.includes(index) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="margin" className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Portfolio Margin</TableHead>
                  <TableHead className="text-right">Order Margin</TableHead>
                  <TableHead className="text-right">Position Margin</TableHead>
                  <TableHead className="text-right">Blocked Margin</TableHead>
                  <TableHead className="text-right">Cross Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No margin data found
                    </TableCell>
                  </TableRow>
                ) : (
                  balances.map((balance, index) => {
                    const currencyInfo = getCurrencyInfo(balance.currency);
                    const hasMargin = parseFloat(balance.portfolio_margin || '0') > 0 || 
                                     parseFloat(balance.order_margin || '0') > 0 || 
                                     parseFloat(balance.position_margin || '0') > 0 ||
                                     parseFloat(balance.blocked_margin || '0') > 0 ||
                                     parseFloat(balance.cross_order_margin || '0') > 0;
                    
                    // Skip rows with no margin data
                    if (!hasMargin && balances.length > 1) return null;
                    
                    return (
                      <TableRow key={index} className={!hasMargin ? "opacity-60" : ""}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`mr-2 font-bold ${currencyInfo.class}`}>
                              {balance.currency}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(balance.portfolio_margin || '0', balance.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(balance.order_margin || '0', balance.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(balance.position_margin || '0', balance.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(balance.blocked_margin || '0', balance.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(balance.cross_order_margin || '0', balance.currency)}
                        </TableCell>
                      </TableRow>
                    );
                  }).filter(Boolean)
                )}
              </TableBody>
            </Table>
            
            <div className="text-xs text-muted-foreground mt-2">
              <p className="flex items-center">
                <PieChart className="h-4 w-4 mr-1 text-primary" />
                <span className="font-medium">Margin Details:</span> Margins represent funds allocated for various trading purposes.
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Expanded row details */}
        {balances.map((balance, index) => (
          expandedRows.includes(index) && (
            <div key={`expanded-${index}`} className="mt-2 mb-4 border border-border rounded-md p-4 bg-muted/10">
              <h4 className="font-semibold mb-2 text-primary">Additional Details</h4>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="fees">
                  <AccordionTrigger className="text-sm font-medium">
                    Fees & Credits
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between p-2 bg-muted/20 rounded">
                        <span className="text-muted-foreground">Commission:</span>
                        <span>{formatCurrency(balance.commission || '0', balance.currency)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/20 rounded">
                        <span className="text-muted-foreground">Cross Commission:</span>
                        <span>{formatCurrency(balance.cross_commission || '0', balance.currency)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/20 rounded">
                        <span className="text-muted-foreground">Trading Fee Credit:</span>
                        <span>{formatCurrency(balance.trading_fee_credit || '0', balance.currency)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/20 rounded">
                        <span className="text-muted-foreground">Pending Trading Fee Credit:</span>
                        <span>{formatCurrency(balance.pending_trading_fee_credit || '0', balance.currency)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/20 rounded">
                        <span className="text-muted-foreground">Referral Bonus:</span>
                        <span>{formatCurrency(balance.referral_bonus || '0', balance.currency)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/20 rounded">
                        <span className="text-muted-foreground">Pending Referral Bonus:</span>
                        <span>{formatCurrency(balance.pending_referral_bonus || '0', balance.currency)}</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="margin">
                  <AccordionTrigger className="text-sm font-medium">
                    Margin & Collateral Details
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between p-2 bg-muted/20 rounded">
                        <span className="text-muted-foreground">Portfolio Margin:</span>
                        <span>{formatCurrency(balance.portfolio_margin || '0', balance.currency)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/20 rounded">
                        <span className="text-muted-foreground">Order Margin:</span>
                        <span>{formatCurrency(balance.order_margin || '0', balance.currency)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/20 rounded">
                        <span className="text-muted-foreground">Position Margin:</span>
                        <span>{formatCurrency(balance.position_margin || '0', balance.currency)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/20 rounded">
                        <span className="text-muted-foreground">Blocked Margin:</span>
                        <span>{formatCurrency(balance.blocked_margin || '0', balance.currency)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/20 rounded">
                        <span className="text-muted-foreground">Cross Order Margin:</span>
                        <span>{formatCurrency(balance.cross_order_margin || '0', balance.currency)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/20 rounded">
                        <span className="text-muted-foreground">Cross Position Margin:</span>
                        <span>{formatCurrency(balance.cross_position_margin || '0', balance.currency)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/20 rounded">
                        <span className="text-muted-foreground">Cross Asset Liability:</span>
                        <span>{formatCurrency(balance.cross_asset_liability || '0', balance.currency)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/20 rounded">
                        <span className="text-muted-foreground">Cross Locked Collateral:</span>
                        <span>{formatCurrency(balance.cross_locked_collateral || '0', balance.currency)}</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="misc">
                  <AccordionTrigger className="text-sm font-medium">
                    Account Information
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between p-2 bg-muted/20 rounded">
                        <span className="text-muted-foreground">Asset ID:</span>
                        <span>{balance.asset_id || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/20 rounded">
                        <span className="text-muted-foreground">Balance ID:</span>
                        <span>{balance.id || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/20 rounded">
                        <span className="text-muted-foreground">User ID:</span>
                        <span>{balance.user_id || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/20 rounded">
                        <span className="text-muted-foreground">Interest Credit:</span>
                        <span>{formatCurrency(balance.interest_credit || '0', balance.currency)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/20 rounded">
                        <span className="text-muted-foreground">Unvested Amount:</span>
                        <span>{formatCurrency(balance.unvested_amount || '0', balance.currency)}</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )
        ))}
        
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Note: This page is using the India region API endpoint (api.india.delta.exchange). If you're experiencing issues, try the diagnostic tool to verify your API credentials.</p>
        </div>
      </CardContent>
    </Card>
  );
} 