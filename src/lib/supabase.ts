import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if we have the necessary environment variables
const isMissingEnvVars = !supabaseUrl || !supabaseAnonKey || 
  supabaseUrl.includes('placeholder') || 
  supabaseAnonKey.includes('placeholder');

// Create a supabase client
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
    db: {
      schema: 'public'
    }
  }
);

// Check if environment variables are missing and handle it
if (isMissingEnvVars) {
  console.warn(
    'Supabase environment variables are missing or using placeholder values. ' +
    'Some functionality may be limited.'
  );
}

// Utility function to check if Supabase is configured correctly
export function isSupabaseConfigured(): boolean {
  return !isMissingEnvVars;
}

// Export a function that can be used to handle missing config gracefully
export function withSupabase<T>(
  callback: () => Promise<T>, 
  fallback: T
): Promise<T> {
  if (isMissingEnvVars) {
    console.warn('Supabase operation skipped due to missing configuration');
    return Promise.resolve(fallback);
  }
  return callback().catch(err => {
    console.error('Supabase operation failed:', err);
    return fallback;
  });
}

export default supabase;

// Types for our database tables
export type Trade = Database['public']['Tables']['trades']['Row'];
export type Position = Database['public']['Tables']['positions']['Row'];
export type Strategy = Database['public']['Tables']['strategies']['Row'];
export type TradingSession = Database['public']['Tables']['trading_sessions']['Row']; 