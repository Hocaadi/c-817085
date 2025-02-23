import { useQuery } from "@tanstack/react-query";

interface PriceData {
  timestamp: number;
  close: number;
  high: number;
  low: number;
  open: number;
}

export const useAadarshStrategy = (symbol: string = "bitcoin") => {
  const { data: priceData } = useQuery({
    queryKey: ['cryptoPrices', symbol],
    queryFn: async () => {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${symbol}/ohlc?vs_currency=usd&days=30`
      );
      const data = await response.json();
      return data.map((item: number[]) => ({
        timestamp: item[0],
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4]
      }));
    },
    refetchInterval: 60000 // Refresh every minute
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
    signals: getSignals(),
    isLoading: !priceData,
    priceData,
  };
}; 