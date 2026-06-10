import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let initialised = false;

/**
 * Returns a client-side Supabase singleton, or null if the environment
 * variables are not configured. Callers must handle the null case and
 * degrade gracefully (sample data, local-only persistence).
 */
export function getSupabase(): SupabaseClient | null {
  if (initialised) return client;
  initialised = true;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  client = createClient(url, anonKey);
  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
