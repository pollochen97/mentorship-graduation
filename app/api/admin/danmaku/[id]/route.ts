// PATCH /api/admin/danmaku/[id] (HideInput) → { danmaku } (#19). Hiding takes it off the projector
// at once (danmaku:remove); un-hiding only undoes a mistake in the list, it doesn't fly again.
import type { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, readJson } from "@/lib/http";
import { broadcast } from "@/lib/supabase/broadcast";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "../../auth";
import { ADMIN_DANMAKU_COLUMNS, toAdminDanmaku } from "../../rows";
import { HideInput } from "../../schemas";

const Id = z.coerce.number().int().positive();

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/danmaku/[id]">) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const id = Id.safeParse((await ctx.params).id);
  if (!id.success) return errorResponse("not_found");
  const input = await readJson(request, HideInput);
  if (!input.ok) return input.response;
  const { hidden } = input.data;

  const { data, error } = await supabaseAdmin()
    .from("danmaku")
    .update({ hidden_at: hidden ? new Date().toISOString() : null })
    .eq("id", id.data)
    .select(ADMIN_DANMAKU_COLUMNS)
    .maybeSingle();
  if (error) {
    console.error("[PATCH /api/admin/danmaku]", error.message);
    return errorResponse("server_error");
  }
  if (!data) return errorResponse("not_found");

  if (hidden) await broadcast("danmaku:remove", { id: data.id });
  return Response.json({ danmaku: toAdminDanmaku(data) });
}
