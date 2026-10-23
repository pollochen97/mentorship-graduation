// Typed calls to the rate-limited insert functions in supabase/migrations (#5), for #15 and #17.
// The API route validates and normalises the input first, then:
//   const r = await postDanmaku({ clientId, ipHash, ...input });
//   if (!r.ok) return errorResponse(r.code, undefined, r.retryAfter);
//   await broadcast("danmaku:new", r.data);
import "server-only";
import type { Danmaku, DanmakuInput, ErrorCode, Note, NoteInput } from "../schemas";
import { toDanmaku, toNote, type DanmakuRow, type NoteRow } from "./rows";
import { supabaseAdmin } from "./server";

export type PostResult<T> =
  { ok: true; data: T } | { ok: false; code: ErrorCode; retryAfter?: number };

type Answer = { error?: string; retry_after?: number; danmaku?: DanmakuRow; note?: NoteRow };

/** Turns the function's jsonb answer, or a failed call, into a PostResult. */
function read<T>(
  name: string,
  answer: { data: unknown; error: { code?: string; message: string } | null },
  pick: (a: Answer) => T | undefined,
): PostResult<T> {
  if (answer.error) {
    // 23514: a check constraint (length, section, colour) rejected input the API should have caught.
    if (answer.error.code === "23514") return { ok: false, code: "invalid_input" };
    console.error(`[${name}]`, answer.error.message);
    return { ok: false, code: "server_error" };
  }
  const a = (answer.data ?? {}) as Answer;
  if (a.error === "rate_limited")
    return { ok: false, code: "rate_limited", retryAfter: a.retry_after };
  if (a.error === "danmaku_paused") return { ok: false, code: "danmaku_paused" };
  if (a.error === "notes_closed") return { ok: false, code: "notes_closed" };
  const data = pick(a);
  if (data === undefined) {
    console.error(`[${name}] unexpected answer`, answer.data);
    return { ok: false, code: "server_error" };
  }
  return { ok: true, data };
}

/** Inserts a danmaku if the client and IP are within the limits and danmaku isn't paused (spec 6.2). */
export async function postDanmaku(
  input: DanmakuInput & { clientId: string; ipHash: string; ipPerMinute?: number },
): Promise<PostResult<Danmaku>> {
  const answer = await supabaseAdmin().rpc("post_danmaku", {
    p_client_id: input.clientId,
    p_ip_hash: input.ipHash,
    p_name: input.name,
    p_body: input.body,
    p_ip_per_minute: input.ipPerMinute,
  });
  return read("post_danmaku", answer, (a) => a.danmaku && toDanmaku(a.danmaku));
}

/** Inserts a note if the guestbooks are open and the client is within the limits (spec 6.2, #55). */
export async function postNote(
  input: NoteInput & { clientId: string; userId: string },
): Promise<PostResult<Note>> {
  const answer = await supabaseAdmin().rpc("post_note", {
    p_client_id: input.clientId,
    p_section: input.section,
    p_name: input.name,
    p_body: input.body,
    p_color: input.color,
    p_user_id: input.userId,
  });
  return read("post_note", answer, (a) => a.note && toNote(a.note));
}
