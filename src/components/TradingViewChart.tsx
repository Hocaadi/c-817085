import { createChart, ColorType } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  data: Array<{
    timestamp?: number;
    time?: string;
    open: number;
    high: number;
    low: number;
    close: number;
  }>;
  colors?: {
    backgroundColor?: string;
    lineColor?: string;
    textColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
  };
}

export const TradingViewChart = ({ data, colors = {} }: TradingViewChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data.length) return;

    // Sort data by timestamp/time before formatting
    const sortedData = [...data].sort((a, b) => {
      const timeA = a.timestamp || new Date(a.time || '').getTime();
      const timeB = b.timestamp || new Date(b.time || '').getTime();
      return timeA - timeB;
    });

    const formattedData = sortedData.map(item => ({
      time: item.timestamp ? item.timestamp / 1000 : new Date(item.time || '').getTime() / 1000,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close
    }));

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.backgroundColor || '#141413' },
        textColor: colors.textColor || '#DDD',
      },
      grid: {
        vertLines: { color: '#2B2B2B' },
        horzLines: { color: '#2B2B2B' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    candlestickSeries.setData(formattedData);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, colors]);

  return <div ref={chartContainerRef} className="w-full h-[400px]" />;
}; 