import { Strategy } from '@/lib/supabase';
import { DeltaExchangeClient } from '../core/DeltaExchangeClient';
import { AdarshBullStrategy } from './AdarshBullStrategy';

export const STRATEGY_TYPES = {
  ADARSH_BULL: 'ADARSH_BULL'
} as const;

export type StrategyType = typeof STRATEGY_TYPES[keyof typeof STRATEGY_TYPES];

export function createStrategy(
  type: StrategyType,
  deltaClient: DeltaExchangeClient,
  strategy: Strategy,
  symbol: string
) {
  console.log(`[StrategyFactory] Creating strategy of type: ${type}`);
  
  switch (type) {
    case STRATEGY_TYPES.ADARSH_BULL:
      return new AdarshBullStrategy(deltaClient, strategy, symbol);
    default:
      throw new Error(`Unknown strategy type: ${type}`);
  }
} 