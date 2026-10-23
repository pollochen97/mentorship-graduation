// GET /api/admin/danmaku (#19) → { danmaku }: the newest 50, newest first, hidden ones included.
import type { NextRequest } from "next/server";
import { errorResponse } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "../auth";
import { ADMIN_DANMAKU_COLUMNS, toAdminDanmaku } from "../rows";

const LIMIT = 50;

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const { data, error } = await supabaseAdmin()
    .from("danmaku")
    .select(ADMIN_DANMAKU_COLUMNS)
    .order("id", { ascending: false })
    .limit(LIMIT);
  if (error) {
    console.error("[GET /api/admin/danmaku]", error.message);
    return errorResponse("server_error");
  }
  return Response.json({ danmaku: data.map(toAdminDanmaku) });
}
