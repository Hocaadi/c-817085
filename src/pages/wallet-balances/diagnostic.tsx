'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeltaExchangeClient } from '@/trading/core/DeltaExchangeClient';

export default function DiagnosticPage() {
  const [apiKey, setApiKey] = useState<string>('');
  const [apiSecret, setApiSecret] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('https://api.india.delta.exchange');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  
  // Override console.log to capture logs for display
  const originalLog = console.log;
  const originalError = console.error;
  
  console.log = (...args) => {
    originalLog(...args);
    const log = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    setLogs(prev => [...prev, `[LOG] ${log}`]);
    scrollToBottom();
  };
  
  console.error = (...args) => {
    originalError(...args);
    const log = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    setLogs(prev => [...prev, `[ERROR] ${log}`]);
    scrollToBottom();
  };
  
  const scrollToBottom = () => {
    setTimeout(() => {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  const clearLogs = () => {
    setLogs([]);
  };
  
  const verifyApiCredentials = async () => {
    clearLogs();
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const client = new DeltaExchangeClient(apiKey, apiSecret, baseUrl);
      setLogs(prev => [...prev, `[TEST] Created client with API endpoint: ${baseUrl}`]);
      
      // Verify API credentials
      setLogs(prev => [...prev, `[TEST] Verifying API credentials...`]);
      const verificationResult = await client.verifyApiCredentials();
      
      setResult(verificationResult);
      
      if (verificationResult.valid) {
        // If credentials are valid, try fetching wallet balances
        setLogs(prev => [...prev, `[TEST] Fetching wallet balances...`]);
        const balances = await client.getBalance();
        setResult({
          ...verificationResult,
          balances
        });
      }
    } catch (err) {
      console.error('API Verification error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">API Diagnostic Tool</h2>
      </div>
      
      <Tabs defaultValue="credentials">
        <TabsList>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="logs">Debug Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="credentials">
          <Card>
            <CardHeader>
              <CardTitle>Verify API Credentials</CardTitle>
              <CardDescription>
                Enter your Delta Exchange API credentials to verify they are working correctly.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input 
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Your Delta Exchange API Key"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="apiSecret">API Secret</Label>
                <Input 
                  id="apiSecret"
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="Your Delta Exchange API Secret"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="baseUrl">API Base URL</Label>
                <Input 
                  id="baseUrl"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="API Base URL"
                />
                <p className="text-xs text-muted-foreground">
                  Use https://api.india.delta.exchange for India region or https://api.delta.exchange for global
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={clearLogs}>Clear Logs</Button>
              <Button onClick={verifyApiCredentials} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Credentials
              </Button>
            </CardFooter>
          </Card>
          
          {result && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Verification Result</CardTitle>
              </CardHeader>
              <CardContent>
                {result.valid ? (
                  <Alert className="bg-green-50 border-green-500">
                    <AlertTitle className="text-green-700">Success</AlertTitle>
                    <AlertDescription className="text-green-700">
                      {result.message}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="bg-red-50 border-red-500">
                    <AlertTitle className="text-red-700">Error</AlertTitle>
                    <AlertDescription className="text-red-700">
                      {result.message}
                    </AlertDescription>
                  </Alert>
                )}
                
                {result.balances && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">Wallet Balances</h3>
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {result.balances.map((balance: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{balance.currency}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{balance.available_balance}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{balance.total_balance}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{balance.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {error && (
            <Card className="mt-4 border-red-500">
              <CardHeader>
                <CardTitle className="text-red-700">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
                <p className="mt-2 text-sm">
                  Check the Debug Logs tab for more details.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Debug Logs</CardTitle>
              <CardDescription>
                These logs can help diagnose API connection issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 font-mono p-4 rounded-md h-[500px] overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-gray-500">No logs yet. Run a verification to see logs.</p>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="whitespace-pre-wrap mb-1">
                      {log}
                    </div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={clearLogs}>Clear Logs</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 