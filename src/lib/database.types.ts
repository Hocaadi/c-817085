export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      notifications: {
        Row: {
          id: string
          created_at: string
          user_id: string
          type: string
          strategy_id: string
          details: Json
          read: boolean
          priority: 'LOW' | 'MEDIUM' | 'HIGH'
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Row']>
      }
      trades: {
        Row: {
          id: string
          created_at: string
          user_id: string
          symbol: string
          side: 'BUY' | 'SELL'
          type: 'MARKET' | 'LIMIT'
          quantity: number
          price: number
          status: 'OPEN' | 'CLOSED' | 'CANCELLED'
          pnl: number
          strategy_id: string
          session_id: string
        }
        Insert: Omit<Database['public']['Tables']['trades']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['trades']['Row']>
      }
      positions: {
        Row: {
          id: string
          created_at: string
          user_id: string
          symbol: string
          side: 'LONG' | 'SHORT'
          entry_price: number
          current_price: number
          quantity: number
          pnl: number
          status: 'OPEN' | 'CLOSED'
          strategy_id: string
          session_id: string
        }
        Insert: Omit<Database['public']['Tables']['positions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['positions']['Row']>
      }
      strategies: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string
          description: string
          parameters: Json
          status: 'ACTIVE' | 'INACTIVE'
          performance_metrics: Json
        }
        Insert: Omit<Database['public']['Tables']['strategies']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['strategies']['Row']>
      }
      trading_sessions: {
        Row: {
          id: string
          created_at: string
          user_id: string
          strategy_id: string
          start_time: string
          end_time: string | null
          initial_balance: number
          final_balance: number | null
          status: 'RUNNING' | 'COMPLETED' | 'STOPPED'
          metrics: Json
        }
        Insert: Omit<Database['public']['Tables']['trading_sessions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['trading_sessions']['Row']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 