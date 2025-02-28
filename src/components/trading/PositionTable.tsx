import { useTrading } from '../../contexts/TradingContext';

export function PositionTable() {
  const { positions } = useTrading();

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-secondary/20">
            <th className="text-left py-3 px-4">Symbol</th>
            <th className="text-left py-3 px-4">Side</th>
            <th className="text-left py-3 px-4">Entry Price</th>
            <th className="text-left py-3 px-4">Quantity</th>
            <th className="text-left py-3 px-4">PnL</th>
            <th className="text-left py-3 px-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position) => (
            <tr key={position.id} className="border-b border-secondary/10">
              <td className="py-3 px-4">{position.symbol}</td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 rounded ${
                    position.side === 'LONG'
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-red-500/20 text-red-500'
                  }`}
                >
                  {position.side}
                </span>
              </td>
              <td className="py-3 px-4">${position.entryPrice.toFixed(2)}</td>
              <td className="py-3 px-4">{position.quantity}</td>
              <td className="py-3 px-4">
                <span
                  className={position.pnl >= 0 ? 'text-green-500' : 'text-red-500'}
                >
                  ${position.pnl.toFixed(2)}
                </span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 rounded ${
                    position.status === 'OPEN'
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-secondary/20'
                  }`}
                >
                  {position.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 