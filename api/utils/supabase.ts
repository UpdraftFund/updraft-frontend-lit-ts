import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../src/types/database/supabase';

export async function createSupabaseServerClient(): Promise<
  SupabaseClient<Database>
> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL environment variable.');
  }
  if (!supabaseAnonKey) {
    throw new Error('Missing SUPABASE_ANON_KEY environment variable.');
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
