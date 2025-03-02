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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { useDeltaClient } from './DeltaClientProvider';

interface Product {
  id: number;
  symbol: string;
  state: string;
  contract_type: string;
  maker_commission_rate: string;
  short_description: string;
  contract_value: string;
  price_band: string;
  tick_size: string;
  is_quanto: boolean;
}

export function ProductsGrid() {
  const client = useDeltaClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLiveOnly, setShowLiveOnly] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await client.getMarkets();
        if (response.success === false) {
          setError('Failed to fetch products');
          return;
        }
        
        // Sort products by state (live first) and then by symbol
        const sortedProducts = response.result
          .sort((a: Product, b: Product) => {
            if (a.state === 'live' && b.state !== 'live') return -1;
            if (a.state !== 'live' && b.state === 'live') return 1;
            return a.symbol.localeCompare(b.symbol);
          });
        
        setProducts(sortedProducts);
        setFilteredProducts(sortedProducts);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [client]);

  // Filter products when search term or live only filter changes
  useEffect(() => {
    let filtered = [...products];
    
    if (showLiveOnly) {
      filtered = filtered.filter(p => p.state === 'live');
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.symbol.toLowerCase().includes(term) ||
        p.short_description.toLowerCase().includes(term) ||
        p.contract_type.toLowerCase().includes(term)
      );
    }
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, showLiveOnly]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
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
          <CardTitle>Products</CardTitle>
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
        <CardTitle>Products ({filteredProducts.length})</CardTitle>
        <div className="flex space-x-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button
            variant={showLiveOnly ? "default" : "outline"}
            onClick={() => setShowLiveOnly(!showLiveOnly)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Live Only
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Contract Value</TableHead>
              <TableHead>Tick Size</TableHead>
              <TableHead>Price Band</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  {product.symbol}
                  <div className="text-xs text-muted-foreground">{product.short_description}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={product.is_quanto ? "outline" : "default"}>
                    {product.contract_type.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={product.state === 'live' ? "default" : "secondary"}
                  >
                    {product.state}
                  </Badge>
                </TableCell>
                <TableCell>
                  {(parseFloat(product.maker_commission_rate) * 100).toFixed(2)}%
                </TableCell>
                <TableCell>{product.contract_value}</TableCell>
                <TableCell>{product.tick_size}</TableCell>
                <TableCell>{product.price_band}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 