// Supabase in the browser, with the public anon key (#5). RLS gives anon nothing but receiving on the
// `live` channel, so these clients never read or write tables; that goes through our API routes.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let authClient: SupabaseClient | null = null;

/** The shared browser client for Realtime (lib/realtime.ts), or null if the public env vars are missing. */
export function supabaseBrowser() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

/**
 * The browser client for the guestbook's Google sign-in (#55, lib/auth.ts), or null without the env
 * vars. Kept apart from the Realtime client: this one keeps its session in localStorage under its own
 * key, and finishes a sign-in when it is created on /auth/callback.
 */
export function supabaseAuth() {
  if (authClient) return authClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  authClient = createClient(url, key, {
    auth: { flowType: "pkce", persistSession: true, storageKey: "guestbook-auth" },
  });
  return authClient;
}
