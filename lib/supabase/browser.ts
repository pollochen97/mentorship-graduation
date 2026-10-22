// Supabase in the browser, with the public anon key (#5). RLS gives anon nothing but receiving on the
// `live` channel, so this client is only for Realtime (lib/realtime.ts); reads and writes go through
// our API routes.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** The shared browser client, or null if the public env vars are missing. */
export function supabaseBrowser() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
