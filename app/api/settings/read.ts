// Reads the settings table (#19). Shared by GET /api/settings and /api/admin/settings.
import "server-only";
import { toSettings } from "@/lib/supabase/rows";
import { supabaseAdmin } from "@/lib/supabase/server";

/** The current Settings, or null (already logged) when the query fails. */
export async function readSettings() {
  const { data, error } = await supabaseAdmin().from("settings").select("key, value");
  if (error) {
    console.error("[settings]", error.message);
    return null;
  }
  return toSettings(data);
}
