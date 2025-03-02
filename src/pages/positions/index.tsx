import React, { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import PositionsGrid from '@/components/PositionsGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServiceDependentContent from '@/components/ServiceDependentContent';
import { useDeltaClient, DeltaClientProvider } from '@/components/DeltaClientProvider';
import { DELTA_EXCHANGE_CREDENTIALS } from '@/config/api-credentials';

interface Position {
  id: number;
  product_id: number;
  product_symbol: string;
  size: number;
  entry_price: number;
  mark_price: number;
  liquidation_price: number | null;
  bankruptcy_price: number | null;
  leverage: number;
  margin: number;
  unrealized_pnl: number;
  realized_pnl: number;
  side: 'buy' | 'sell';
  created_at: string;
  updated_at: string;
}

export default function PositionsPage() {
  // Get credentials from the centralized config
  const { apiKey, apiSecret } = DELTA_EXCHANGE_CREDENTIALS;
  
  // Return the wrapped component with DeltaClientProvider
  return (
    <DeltaClientProvider apiKey={apiKey} apiSecret={apiSecret}>
      <PositionsContent />
    </DeltaClientProvider>
  );
}

// Separate component to use Delta client hooks within the provider context
function PositionsContent() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();
  
  // Use the Delta client provider instead of direct initialization
  const { client, isInitialized, error: clientError } = useDeltaClient();
  
  // Calculate total unrealized P&L
  const totalUnrealizedPnl = positions.reduce((total, position) => {
    return total + position.unrealized_pnl;
  }, 0);

  // Format currency value with appropriate decimals
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Function to get error message from different error types
  const getErrorMessage = (error: unknown): string => {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (error && typeof error === 'object' && 'message' in error) 
      return (error as { message: string }).message;
    return 'Unknown error';
  };

  const fetchPositions = async () => {
    if (!client) {
      setError(new Error("Delta Exchange client not available"));
      toast({
        title: "Client Error",
        description: "Delta Exchange client is not available. Please check your connection.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch the positions using the client from the provider
      const response = await client.getPositions(false);
      if (response && Array.isArray(response)) {
        setPositions(response);
        setLastUpdated(new Date());
        toast({
          title: "Positions updated",
          description: `Successfully loaded ${response.length} positions`,
        });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching positions:", err);
      setError(err instanceof Error ? err : new Error('Failed to fetch positions'));
      toast({
        title: "Error",
        description: "Failed to load positions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch positions on component mount or when client is initialized
  useEffect(() => {
    if (isInitialized && client) {
      fetchPositions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, client]);

  return (
    <div className="container mx-auto py-6">
      <ServiceDependentContent
        serviceName="DeltaExchange"
        errorFallback={
          <Card>
            <CardHeader>
              <CardTitle>Positions</CardTitle>
              <CardDescription>
                {clientError 
                  ? `Error connecting to Delta Exchange: ${getErrorMessage(clientError)}`
                  : "Connect to Delta Exchange to view your positions"}
              </CardDescription>
            </CardHeader>
          </Card>
        }
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Positions</h1>
            <p className="text-muted-foreground">
              {lastUpdated
                ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
                : "Fetching positions..."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPositions}
            disabled={isLoading || !client || !isInitialized}
            className="gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Updating..." : "Refresh"}
          </Button>
        </div>

        {positions.length > 0 && (
          <div className="grid gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Summary</CardTitle>
                <CardDescription>Overview of your trading positions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium">Total Positions</p>
                    <p className="text-2xl font-bold">{positions.length}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Unrealized P&L</p>
                    <p className={`text-2xl font-bold ${totalUnrealizedPnl > 0 ? 'text-green-500' : totalUnrealizedPnl < 0 ? 'text-red-500' : ''}`}>
                      {totalUnrealizedPnl > 0 ? '+' : ''}
                      {formatCurrency(totalUnrealizedPnl)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="active">
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active Positions</TabsTrigger>
            <TabsTrigger value="all">All Positions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {positions.length > 0 ? (
              <PositionsGrid
                positions={positions.filter(pos => pos.size !== 0)}
                isLoading={isLoading}
                error={error}
                onRefresh={fetchPositions}
              />
            ) : !isLoading && !error ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground mb-2">You don't have any active positions.</p>
                  <p className="text-sm text-muted-foreground">
                    When you open positions, they will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
          
          <TabsContent value="all">
            <PositionsGrid
              positions={positions}
              isLoading={isLoading}
              error={error}
              onRefresh={fetchPositions}
            />
          </TabsContent>
        </Tabs>
      </ServiceDependentContent>
    </div>
  );
} 