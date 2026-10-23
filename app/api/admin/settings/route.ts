// GET / PUT /api/admin/settings (#19). PUT is the danmaku master switch: it writes settings and sends
// settings:update, so the projector hides or shows danmaku at once and POST /api/danmaku answers 503.
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

  const { error } = await supabaseAdmin()
    .from("settings")
    .upsert({ key: "danmaku_enabled", value: input.data.danmakuEnabled });
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
