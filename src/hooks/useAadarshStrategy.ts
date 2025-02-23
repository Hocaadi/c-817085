import { useQuery } from "@tanstack/react-query";

interface PriceData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export const useAadarshStrategy = (symbol: string = "bitcoin") => {
  const { data: priceData, isLoading } = useQuery({
    queryKey: ['cryptoPrices', symbol],
    queryFn: async () => {
      try {
        // Fetch both OHLC and current price data
        const [ohlcResponse, currentPriceResponse] = await Promise.all([
          fetch(`/api/coingecko/coins/${symbol}/ohlc?vs_currency=usd&days=30`),
          fetch(`/api/coingecko/simple/price?ids=${symbol}&vs_currencies=usd&include_24hr_change=true`)
        ]);

        if (!ohlcResponse.ok || !currentPriceResponse.ok) {
          throw new Error('Failed to fetch price data');
        }

        const [ohlcData, currentPrice] = await Promise.all([
          ohlcResponse.json(),
          currentPriceResponse.json()
        ]);

        // Format and sort historical data
        const historicalData = ohlcData
          .map((item: number[]) => ({
            timestamp: item[0],
            open: item[1],
            high: item[2],
            low: item[3],
            close: item[4]
          }))
          .sort((a: any, b: any) => a.timestamp - b.timestamp);

        // Add current price as the latest candle
        const lastCandle = historicalData[historicalData.length - 1];
        const currentTimestamp = Date.now();
        
        if (currentTimestamp - lastCandle.timestamp >= 60000) { // If last candle is older than 1 minute
          historicalData.push({
            timestamp: currentTimestamp,
            open: lastCandle.close,
            high: Math.max(lastCandle.close, currentPrice[symbol].usd),
            low: Math.min(lastCandle.close, currentPrice[symbol].usd),
            close: currentPrice[symbol].usd
          });
        }

        return historicalData;
      } catch (error) {
        console.error('Error fetching price data:', error);
        return [];
      }
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000, // Consider data fresh for 5 seconds
    cacheTime: 3600000, // Cache for 1 hour
    retry: 3,
    retryDelay: 1000,
  });

  const calculateATR = (period: number, prices: PriceData[]) => {
    if (!prices || prices.length < period) return [];
    
    const trueRanges = prices.map((price, i) => {
      if (i === 0) return price.high - price.low;
      const previousClose = prices[i - 1].close;
      return Math.max(
        price.high - price.low,
        Math.abs(price.high - previousClose),
        Math.abs(price.low - previousClose)
      );
    });

    const atrs = [];
    let atr = trueRanges.slice(0, period).reduce((a, b) => a + b) / period;
    atrs.push(atr);

    for (let i = period; i < prices.length; i++) {
      atr = ((atr * (period - 1)) + trueRanges[i]) / period;
      atrs.push(atr);
    }

    return atrs;
  };

  const getSignals = () => {
    if (!priceData || priceData.length < 2) return null;

    const config = {
      atrPeriod: 30,
      stopLossMultiplier: 3,
      profitTargetMultiplier: 6,
      stdctc: 100
    };

    const atrs = calculateATR(config.atrPeriod, priceData);
    const currentPrice = priceData[priceData.length - 1];
    const previousPrice = priceData[priceData.length - 2];
    const currentATR = atrs[atrs.length - 1];

    // Buy condition
    const buyCondition = 
      currentPrice.close > previousPrice.close &&
      (currentPrice.close - previousPrice.close) > config.stdctc &&
      currentPrice.high > previousPrice.high &&
      currentPrice.low > previousPrice.low;

    // Sell condition
    const sellCondition = 
      currentPrice.close < previousPrice.low ||
      (currentPrice.low <= currentPrice.open - 200) &&
      currentPrice.high < previousPrice.high;

    // Calculate levels
    const levels = buyCondition ? {
      entryPrice: currentPrice.close,
      stopLoss: currentPrice.close - (currentATR * config.stopLossMultiplier),
      profitTarget: currentPrice.close + (currentATR * config.profitTargetMultiplier)
    } : null;

    return {
      buySignal: buyCondition,
      sellSignal: sellCondition,
      levels
    };
  };

  return {
    signals: priceData ? getSignals() : null,
    isLoading,
    priceData,
  };
}; 