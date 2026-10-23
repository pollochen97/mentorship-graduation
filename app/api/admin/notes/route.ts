// GET /api/admin/notes?section=m1 (#19) → { notes }: newest first, hidden ones included. Without
// `section`, every guestbook.
import type { NextRequest } from "next/server";
import { errorResponse } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "../auth";
import { ADMIN_NOTE_COLUMNS, toAdminNote } from "../rows";
import { NotesFilter } from "../schemas";

/** Enough to find a note posted during the event; older ones are rarely the problem. */
const LIMIT = 200;

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const section = NotesFilter.safeParse(request.nextUrl.searchParams.get("section") ?? undefined);
  if (!section.success) return errorResponse("invalid_input", "section 必須是 m1–m4");

  let query = supabaseAdmin().from("notes").select(ADMIN_NOTE_COLUMNS);
  if (section.data) query = query.eq("section", section.data);
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(LIMIT);
  if (error) {
    console.error("[GET /api/admin/notes]", error.message);
    return errorResponse("server_error");
  }
  return Response.json({ notes: data.map(toAdminNote) });
}
