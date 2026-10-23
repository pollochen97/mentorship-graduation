// PATCH /api/admin/notes/[id] (HideInput) → { note } (#19). Hides or un-hides a note and tells the
// projector (note:hide), which removes it from or puts it back on the guestbook.
import type { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, readJson } from "@/lib/http";
import { broadcast } from "@/lib/supabase/broadcast";
import { toNote } from "@/lib/supabase/rows";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "../../auth";
import { ADMIN_NOTE_COLUMNS, toAdminNote } from "../../rows";
import { HideInput } from "../../schemas";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/notes/[id]">) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const id = z.uuid().safeParse((await ctx.params).id);
  if (!id.success) return errorResponse("not_found");
  const input = await readJson(request, HideInput);
  if (!input.ok) return input.response;
  const { hidden } = input.data;

  const { data, error } = await supabaseAdmin()
    .from("notes")
    .update({ hidden_at: hidden ? new Date().toISOString() : null })
    .eq("id", id.data)
    .select(ADMIN_NOTE_COLUMNS)
    .maybeSingle();
  if (error) {
    console.error("[PATCH /api/admin/notes]", error.message);
    return errorResponse("server_error");
  }
  if (!data) return errorResponse("not_found");

  await broadcast("note:hide", { note: toNote(data), hidden });
  return Response.json({ note: toAdminNote(data) });
}
