// Guestbook notes (#15, spec 5.3). Reads and writes go through the service role; browsers never
// touch the notes table directly.
import type { NextRequest } from "next/server";
import { errorResponse, readJson } from "@/lib/http";
import { isForbidden, NormalizedText } from "@/lib/profanity";
import { readPoster } from "@/lib/ratelimit";
import { NoteInput, NoteSection } from "@/lib/schemas";
import { broadcast } from "@/lib/supabase/broadcast";
import { readMember } from "@/lib/supabase/member";
import { postNote } from "@/lib/supabase/posts";
import { NOTE_COLUMNS, type NoteRow, toNote } from "@/lib/supabase/rows";
import { supabaseAdmin } from "@/lib/supabase/server";

/** NoteInput, checked after normalising (spec 6.3), so lengths count what will be stored. */
const Input = NoteInput.extend({
  name: NormalizedText.pipe(NoteInput.shape.name),
  body: NormalizedText.pipe(NoteInput.shape.body),
});

/** Rows per request; must not exceed max_rows (supabase/config.toml), or a capped page would look like the last. */
const PAGE_SIZE = 1000;

/** GET /api/notes?section=m1 → { notes }: the visible notes of one guestbook, oldest first. */
export async function GET(request: NextRequest) {
  const section = NoteSection.safeParse(request.nextUrl.searchParams.get("section"));
  if (!section.success) return errorResponse("invalid_input", "section 必須是 m1–m4");

  // PostgREST caps every response at max_rows, so read page by page until a short page. Each page
  // starts after the last (created_at, id) seen, not at an offset: a note hidden on an earlier page
  // mid-read would otherwise shift the rest forward and drop one that is still visible.
  const rows: NoteRow[] = [];
  for (;;) {
    let query = supabaseAdmin()
      .from("notes")
      .select(NOTE_COLUMNS)
      .eq("section", section.data)
      .is("hidden_at", null);
    const last = rows.at(-1);
    if (last) {
      const t = `"${last.created_at}"`;
      query = query.or(`created_at.gt.${t},and(created_at.eq.${t},id.gt.${last.id})`);
    }
    const { data, error } = await query.order("created_at").order("id").limit(PAGE_SIZE);
    if (error) {
      console.error("[GET /api/notes]", error.message);
      return errorResponse("server_error");
    }
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return Response.json({ notes: rows.map(toNote) });
}

/**
 * POST /api/notes (NoteInput) → 201 { note }, then note:new to the projector. Only for a Google
 * sign-in on the whitelist (#55), sent as `Authorization: Bearer <access token>`.
 */
export async function POST(request: NextRequest) {
  const poster = readPoster(request);
  if (!poster.ok) return errorResponse(poster.code);
  const member = await readMember(request);
  if (!member.ok) return errorResponse(member.code);
  if (!member.allowed) return errorResponse("not_allowed");

  const input = await readJson(request, Input);
  if (!input.ok) return input.response;
  const { name, body } = input.data;
  if (isForbidden(name) || isForbidden(body)) return errorResponse("forbidden_content");

  const r = await postNote({ ...input.data, clientId: poster.clientId, userId: member.userId });
  if (!r.ok) return errorResponse(r.code, undefined, r.retryAfter);

  await broadcast("note:new", r.data);
  return Response.json({ note: r.data }, { status: 201 });
}
