import { supabase } from '@/lib/supabase';
import type { Trade, Position, Strategy, TradingSession } from '@/lib/supabase';
import { OrderRequest } from '@/trading/core/types';

export class DatabaseService {
  // Trading Sessions
  async createTradingSession(userId: string, strategyId: string, initialBalance: number): Promise<TradingSession> {
    const { data, error } = await supabase
      .from('trading_sessions')
      .insert({
        user_id: userId,
        strategy_id: strategyId,
        start_time: new Date().toISOString(),
        initial_balance: initialBalance,
        status: 'RUNNING',
        metrics: {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTradingSession(sessionId: string, metrics: any, finalBalance?: number): Promise<void> {
    const updates: Partial<TradingSession> = {
      metrics,
      ...(finalBalance && {
        final_balance: finalBalance,
        end_time: new Date().toISOString(),
        status: 'COMPLETED'
      })
    };

    const { error } = await supabase
      .from('trading_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (error) throw error;
  }

  // Trades
  async recordTrade(
    userId: string,
    sessionId: string,
    strategyId: string,
    orderRequest: OrderRequest,
    executedPrice: number
  ): Promise<Trade> {
    const { data, error } = await supabase
      .from('trades')
      .insert({
        user_id: userId,
        session_id: sessionId,
        strategy_id: strategyId,
        symbol: orderRequest.symbol,
        side: orderRequest.side,
        type: orderRequest.type,
        quantity: orderRequest.quantity,
        price: executedPrice,
        status: 'OPEN',
        pnl: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTrade(tradeId: string, status: 'CLOSED' | 'CANCELLED', pnl: number): Promise<void> {
    const { error } = await supabase
      .from('trades')
      .update({ status, pnl })
      .eq('id', tradeId);

    if (error) throw error;
  }

  // Positions
  async openPosition(
    userId: string,
    sessionId: string,
    strategyId: string,
    position: Omit<Position, 'id' | 'created_at' | 'status' | 'pnl'>
  ): Promise<Position> {
    const { data, error } = await supabase
      .from('positions')
      .insert({
        user_id: userId,
        session_id: sessionId,
        strategy_id: strategyId,
        symbol: position.symbol,
        side: position.side,
        entry_price: position.entry_price,
        current_price: position.current_price,
        quantity: position.quantity,
        status: 'OPEN',
        pnl: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePosition(positionId: string, currentPrice: number, pnl: number, status?: 'CLOSED'): Promise<void> {
    const updates: Partial<Position> = {
      current_price: currentPrice,
      pnl,
      ...(status && { status })
    };

    const { error } = await supabase
      .from('positions')
      .update(updates)
      .eq('id', positionId);

    if (error) throw error;
  }

  // Strategies
  async saveStrategy(
    userId: string, 
    strategy: Omit<Strategy, 'id' | 'created_at'>
  ): Promise<Strategy> {
    const { data, error } = await supabase
      .from('strategies')
      .insert({
        user_id: userId,
        name: strategy.name,
        description: strategy.description,
        parameters: strategy.parameters,
        status: strategy.status,
        performance_metrics: strategy.performance_metrics
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateStrategyMetrics(strategyId: string, metrics: any): Promise<void> {
    const { error } = await supabase
      .from('strategies')
      .update({
        performance_metrics: metrics
      })
      .eq('id', strategyId);

    if (error) throw error;
  }

  // Queries
  async getActivePositions(userId: string): Promise<Position[]> {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'OPEN');

    if (error) throw error;
    return data;
  }

  async getStrategyPerformance(strategyId: string): Promise<Strategy> {
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', strategyId)
      .single();

    if (error) throw error;
    return data;
  }

  async getSessionHistory(userId: string): Promise<TradingSession[]> {
    const { data, error } = await supabase
      .from('trading_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
} 