// Guestbook notes (#15, spec 5.3). Reads and writes go through the service role; browsers never
// touch the notes table directly.
import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { errorResponse, readJson } from "@/lib/http";
import { NoteInput, NoteSection } from "@/lib/schemas";
import { broadcast } from "@/lib/supabase/broadcast";
import { postNote } from "@/lib/supabase/posts";
import { NOTE_COLUMNS, toNote } from "@/lib/supabase/rows";
import { supabaseAdmin } from "@/lib/supabase/server";

/** GET /api/notes?section=m1 → { notes }: the visible notes of one guestbook, oldest first. */
export async function GET(request: NextRequest) {
  const section = NoteSection.safeParse(request.nextUrl.searchParams.get("section"));
  if (!section.success) return errorResponse("invalid_input", "section 必須是 m1–m4");

  const { data, error } = await supabaseAdmin()
    .from("notes")
    .select(NOTE_COLUMNS)
    .eq("section", section.data)
    .is("hidden_at", null)
    .order("created_at")
    .order("id");
  if (error) {
    console.error("[GET /api/notes]", error.message);
    return errorResponse("server_error");
  }
  return Response.json({ notes: data.map(toNote) });
}

/** POST /api/notes (NoteInput) → 201 { note }, then note:new to the projector. */
export async function POST(request: NextRequest) {
  const input = await readJson(request, NoteInput);
  if (!input.ok) return input.response;
  // TODO(#17): run the shared content filter (lib/profanity.ts) once it exists → forbidden_content.

  const r = await postNote({ ...input.data, clientId: clientId(request) });
  if (!r.ok) return errorResponse(r.code, undefined, r.retryAfter);

  await broadcast("note:new", r.data);
  return Response.json({ note: r.data }, { status: 201 });
}

/**
 * Who is posting, for rate limiting (spec 6.1).
 * TODO(#17): verify the signed `cid` cookie and answer 401 when it is missing or invalid. Until #17
 * issues the cookie, an unverified cookie value is used if there is one, else a hash of the IP
 * (never the IP itself).
 */
function clientId(request: NextRequest) {
  const cid = request.cookies.get("cid")?.value;
  if (cid) return cid;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return "ip:" + createHash("sha256").update(ip).digest("hex").slice(0, 32);
}
