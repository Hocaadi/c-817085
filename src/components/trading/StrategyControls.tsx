import { useTrading } from '../../contexts/TradingContext';

const AVAILABLE_TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
const AVAILABLE_COINS = ['BTC', 'ETH', 'SOL', 'BNB'];

export function StrategyControls() {
  const {
    selectedTimeframes,
    selectedCoin,
    quantity,
    isStrategyActive,
    updateTimeframes,
    updateCoin,
    updateQuantity,
    toggleStrategy
  } = useTrading();

  return (
    <div className="bg-secondary/5 rounded-lg p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Select Timeframes</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => {
                if (selectedTimeframes.includes(tf)) {
                  updateTimeframes(selectedTimeframes.filter((t) => t !== tf));
                } else {
                  updateTimeframes([...selectedTimeframes, tf]);
                }
              }}
              className={`px-3 py-1 rounded ${
                selectedTimeframes.includes(tf)
                  ? 'bg-primary text-white'
                  : 'bg-secondary/20 hover:bg-secondary/30'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select Coin</label>
          <select
            value={selectedCoin}
            onChange={(e) => updateCoin(e.target.value)}
            className="w-full bg-background border border-secondary/20 rounded px-3 py-2"
          >
            {AVAILABLE_COINS.map((coin) => (
              <option key={coin} value={coin}>
                {coin}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Quantity</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => updateQuantity(Number(e.target.value))}
            className="w-full bg-background border border-secondary/20 rounded px-3 py-2"
          />
        </div>
      </div>

      <button
        onClick={toggleStrategy}
        className={`w-full py-3 rounded-lg font-medium ${
          isStrategyActive
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-green-500 hover:bg-green-600'
        } text-white`}
      >
        {isStrategyActive ? 'Stop Strategy' : 'Start Strategy'}
      </button>
    </div>
  );
} 