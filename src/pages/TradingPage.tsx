import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, ArrowDownCircle, Activity, DollarSign, Percent, Timer } from 'lucide-react';

interface Trade {
  id: string;
  strategy: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  pnl: number | null;
  status: 'ACTIVE' | 'CLOSED';
  timestamp: string;
}

const TradingPage = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [trades, setTrades] = useState<Trade[]>([]); // This will store your trades

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Trading Terminal</h1>
        <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Strategy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ma_crossover">MA Crossover</SelectItem>
            <SelectItem value="rsi_divergence">RSI Divergence</SelectItem>
            <SelectItem value="breakout">Breakout Strategy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Strategy Performance Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Strategy Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+24.5%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        {/* Total Profit/Loss Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">+$1,234.56</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        {/* Active Trades Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        {/* Win Rate Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">
              Based on closed trades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Trades Section */}
      <Card>
        <CardHeader>
          <CardTitle>Active Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Strategy</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Entry Price</TableHead>
                <TableHead>Current Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unrealized P&L</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>MA Crossover</TableCell>
                <TableCell>
                  <Badge variant="success">LONG</Badge>
                </TableCell>
                <TableCell>$83,450</TableCell>
                <TableCell>$83,616</TableCell>
                <TableCell>0.1 BTC</TableCell>
                <TableCell className="text-green-500">+$166</TableCell>
                <TableCell>2h 15m</TableCell>
                <TableCell>
                  <Button variant="destructive" size="sm">Close Trade</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Trade History Section */}
      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Strategy</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Entry/Exit</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Realized P&L</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>2024-01-28</TableCell>
                <TableCell>RSI Divergence</TableCell>
                <TableCell>
                  <Badge variant="destructive">SHORT</Badge>
                </TableCell>
                <TableCell>$84,200 / $83,950</TableCell>
                <TableCell>0.15 BTC</TableCell>
                <TableCell className="text-green-500">+$375</TableCell>
                <TableCell>
                  <Badge>CLOSED</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradingPage; 