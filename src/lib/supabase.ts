import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Types for our database tables
export type Trade = Database['public']['Tables']['trades']['Row'];
export type Position = Database['public']['Tables']['positions']['Row'];
export type Strategy = Database['public']['Tables']['strategies']['Row'];
export type TradingSession = Database['public']['Tables']['trading_sessions']['Row']; 