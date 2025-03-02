import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, ArrowDown } from "lucide-react";

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

interface PositionsGridProps {
  positions: Position[];
  isLoading: boolean;
  error: Error | null;
  onRefresh: () => void;
}

const PositionsGrid: React.FC<PositionsGridProps> = ({ positions, isLoading, error, onRefresh }) => {
  // Format price with appropriate decimals
  const formatPrice = (price: number | null): string => {
    if (price === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(price);
  };

  // Get CSS class for PNL based on value
  const getPnlClass = (pnl: number): string => {
    if (pnl > 0) return 'text-green-500';
    if (pnl < 0) return 'text-red-500';
    return '';
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Calculate ROE (Return on Equity)
  const calculateRoe = (position: Position): number => {
    if (!position.margin || position.margin === 0) return 0;
    return position.unrealized_pnl / position.margin;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-500 mb-2">Error loading positions: {error.message}</p>
          <button 
            onClick={onRefresh}
            className="text-blue-500 underline"
          >
            Try again
          </button>
        </CardContent>
      </Card>
    );
  }

  if (positions.length === 0) {
    return null; // Empty state is handled by parent component
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Side</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Entry Price</TableHead>
              <TableHead>Mark Price</TableHead>
              <TableHead className="text-right">Unrealized P&L</TableHead>
              <TableHead className="text-right">ROE</TableHead>
              <TableHead className="text-right">Liquidation Price</TableHead>
              <TableHead className="text-right">Leverage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((position) => (
              <TableRow key={position.id}>
                <TableCell className="font-medium">{position.product_symbol}</TableCell>
                <TableCell>
                  <Badge 
                    variant={position.side === 'buy' ? 'outline' : 'secondary'}
                    className={position.side === 'buy' ? 'border-green-500 text-green-600 bg-green-50' : 'border-red-500 text-red-600 bg-red-50'}
                  >
                    {position.side === 'buy' ? (
                      <><ArrowUp className="h-3 w-3 mr-1" /> Long</>
                    ) : (
                      <><ArrowDown className="h-3 w-3 mr-1" /> Short</>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>{position.size}</TableCell>
                <TableCell>{formatPrice(position.entry_price)}</TableCell>
                <TableCell>{formatPrice(position.mark_price)}</TableCell>
                <TableCell className={`text-right ${getPnlClass(position.unrealized_pnl)}`}>
                  {position.unrealized_pnl > 0 ? '+' : ''}
                  {position.unrealized_pnl.toFixed(2)} USD
                </TableCell>
                <TableCell className={`text-right ${getPnlClass(calculateRoe(position))}`}>
                  {calculateRoe(position) > 0 ? '+' : ''}
                  {formatPercentage(calculateRoe(position))}
                </TableCell>
                <TableCell className="text-right">
                  {formatPrice(position.liquidation_price)}
                </TableCell>
                <TableCell className="text-right">
                  {position.leverage}x
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PositionsGrid; 