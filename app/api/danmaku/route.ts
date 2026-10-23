// Danmaku (#17, spec 3.2 and 6). Phones POST through the full anti-spam chain; the projector polls
// GET ?since= while Realtime is down. Everything goes through the service role.
import type { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, readJson } from "@/lib/http";
import { isForbidden, NormalizedText } from "@/lib/profanity";
import { readPoster } from "@/lib/ratelimit";
import { DanmakuInput } from "@/lib/schemas";
import { broadcast } from "@/lib/supabase/broadcast";
import { postDanmaku } from "@/lib/supabase/posts";
import { DANMAKU_COLUMNS, toDanmaku } from "@/lib/supabase/rows";
import { supabaseAdmin } from "@/lib/supabase/server";

/** DanmakuInput, checked after normalising (spec 6.3), so lengths count what will be stored. */
const Input = z.object({
  name: NormalizedText.pipe(DanmakuInput.shape.name),
  body: NormalizedText.pipe(DanmakuInput.shape.body),
});

/** At most this many per GET: the newest ones (see lib/schemas.ts). */
const SINCE_LIMIT = 50;

/** GET /api/danmaku?since=<id> → { danmaku }: visible danmaku newer than `since`, oldest first. */
export async function GET(request: NextRequest) {
  const since = z.coerce
    .number()
    .int()
    .min(0)
    .safeParse(request.nextUrl.searchParams.get("since") ?? 0);
  if (!since.success) return errorResponse("invalid_input", "since 必須是非負整數");

  const { data, error } = await supabaseAdmin()
    .from("danmaku")
    .select(DANMAKU_COLUMNS)
    .gt("id", since.data)
    .is("hidden_at", null)
    .order("id", { ascending: false })
    .limit(SINCE_LIMIT);
  if (error) {
    console.error("[GET /api/danmaku]", error.message);
    return errorResponse("server_error");
  }
  return Response.json({ danmaku: data.reverse().map(toDanmaku) });
}

/** POST /api/danmaku (DanmakuInput) → 201 { danmaku }, then danmaku:new to the projector. */
export async function POST(request: NextRequest) {
  const poster = readPoster(request);
  if (!poster.ok) return errorResponse(poster.code);

  const input = await readJson(request, Input);
  if (!input.ok) return input.response;
  const { name, body } = input.data;
  if (isForbidden(name) || isForbidden(body)) return errorResponse("forbidden_content");

  // Also answers danmaku_paused (503) when the admin has turned danmaku off.
  const r = await postDanmaku({ name, body, clientId: poster.clientId, ipHash: poster.ipHash });
  if (!r.ok) return errorResponse(r.code, undefined, r.retryAfter);

  await broadcast("danmaku:new", r.data);
  return Response.json({ danmaku: r.data }, { status: 201 });
}
