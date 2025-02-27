import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface PriceData {
  bitcoin: {
    usd: number;
  };
}

export const useAadarshStrategy = (isActive: boolean = false) => {
  const [positions, setPositions] = useState<any[]>([]);
  
  // Only fetch data if strategy is active
  const { data: priceData, isLoading, error } = useQuery<PriceData>({
    queryKey: ['bitcoin-price'],
    queryFn: async () => {
      if (!isActive) return null; // Don't fetch if strategy isn't active
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      if (!response.ok) {
        throw new Error('Failed to fetch price data');
      }
      return response.json();
    },
    enabled: isActive, // Only run query when strategy is active
    refetchInterval: isActive ? 30000 : false, // Refetch every 30 seconds if active
  });

  // Strategy logic
  useEffect(() => {
    if (!isActive || !priceData) return;
    
    // Strategy implementation here
    // This will only run when the strategy is active and we have price data
    
  }, [isActive, priceData]);

  return {
    positions,
    currentPrice: priceData?.bitcoin?.usd || null,
    isLoading,
    error
  };
}; 