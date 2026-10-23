// GET / PUT /api/admin/settings (#19). PUT sets the danmaku master switch or the guestbook switch
// (#55): it writes settings and sends settings:update, so the projector hides or shows danmaku at once,
// POST /api/danmaku answers 503 and POST /api/notes answers notes_closed.
import type { NextRequest } from "next/server";
import { errorResponse, readJson } from "@/lib/http";
import { broadcast } from "@/lib/supabase/broadcast";
import { supabaseAdmin } from "@/lib/supabase/server";
import { readSettings } from "../../settings/read";
import { requireAdmin } from "../auth";
import { SettingsInput } from "../schemas";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const settings = await readSettings();
  return settings ? Response.json(settings) : errorResponse("server_error");
}

export async function PUT(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const input = await readJson(request, SettingsInput);
  if (!input.ok) return input.response;

  const { danmakuEnabled, notesEnabled } = input.data;
  const rows = [];
  if (danmakuEnabled !== undefined) rows.push({ key: "danmaku_enabled", value: danmakuEnabled });
  if (notesEnabled !== undefined) rows.push({ key: "notes_enabled", value: notesEnabled });
  const { error } = await supabaseAdmin().from("settings").upsert(rows);
  if (error) {
    console.error("[PUT /api/admin/settings]", error.message);
    return errorResponse("server_error");
  }
  // Send everything, not just the switch: settings:update replaces the projector's settings.
  const settings = await readSettings();
  if (!settings) return errorResponse("server_error");
  await broadcast("settings:update", settings);
  return Response.json(settings);
}
