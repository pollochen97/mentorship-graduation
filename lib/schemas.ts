// Shared data shapes for the API, Broadcast events and the UI (#4). Frozen after P0: changing them
// needs a PR labelled `contract`. The API speaks camelCase; database rows are snake_case (see #5).
import { z } from "zod";

/** Character count as people see it: an emoji or a CJK character counts as 1 (str.length would say 2 for emoji). */
export function charCount(str: string) {
  return [...str].length;
}

/** A trimmed, non-empty string of at most `max` characters, counted with charCount(). */
function text(max: number) {
  return z
    .string()
    .trim()
    .refine((s) => s.length > 0, "必填")
    .refine((s) => charCount(s) <= max, `最多 ${max} 個字`);
}

export const LIMITS = {
  noteName: 20,
  noteBody: 50,
  danmakuName: 10,
  danmakuBody: 20,
} as const;

// ---- guestbook notes ----

/** Chapters with a guestbook: monthly meetings 1–4. */
export const NoteSection = z.enum(["m1", "m2", "m3", "m4"]);
export type NoteSection = z.infer<typeof NoteSection>;

/** Index into ACCENTS (yellow, mint, pink, blue). The writer's pad colour, picked at random. */
export const NoteColor = z.int().min(0).max(3);

export const NoteInput = z.object({
  section: NoteSection,
  name: text(LIMITS.noteName),
  body: text(LIMITS.noteBody),
  color: NoteColor,
});
export type NoteInput = z.infer<typeof NoteInput>;

export const Note = z.object({
  id: z.uuid(),
  section: NoteSection,
  name: z.string(),
  body: z.string(),
  color: NoteColor,
  createdAt: z.iso.datetime({ offset: true }),
});
export type Note = z.infer<typeof Note>;

// ---- danmaku ----

export const DanmakuInput = z.object({
  name: text(LIMITS.danmakuName),
  body: text(LIMITS.danmakuBody),
});
export type DanmakuInput = z.infer<typeof DanmakuInput>;

export const Danmaku = z.object({
  /** Increases with every message, so it also works as the `since` cursor for polling. */
  id: z.int().positive(),
  name: z.string(),
  body: z.string(),
  createdAt: z.iso.datetime({ offset: true }),
});
export type Danmaku = z.infer<typeof Danmaku>;

// ---- settings ----

export const Settings = z.object({
  danmakuEnabled: z.boolean(),
  /** Whether the guestbooks take new notes; the admin opens them for a few days (#55). */
  notesEnabled: z.boolean(),
  /** Public URL of the final group photo; null until the admin uploads it. */
  finalPhotoUrl: z.url().nullable(),
});
export type Settings = z.infer<typeof Settings>;

// ---- the signed-in writer (#55) ----

/** Who is signed in with Google, and whether that address is on the guestbook's whitelist. */
export const Me = z.object({ email: z.string(), allowed: z.boolean() });
export type Me = z.infer<typeof Me>;

// ---- API responses ----
// GET  /api/notes?section=m1      → NotesResponse
// POST /api/notes   (NoteInput)    → NoteResponse; needs `Authorization: Bearer <Supabase access token>`
// GET  /api/me                     → Me; the same header
// POST /api/danmaku (DanmakuInput) → DanmakuResponse
// GET  /api/danmaku?since=<id>     → DanmakuListResponse: newer than id, oldest first; if more than
//                                    50 match, only the newest 50 (so since=0 gives the latest ones)
// GET  /api/settings               → Settings

export const NotesResponse = z.object({ notes: z.array(Note) });
export const NoteResponse = z.object({ note: Note });
export const DanmakuResponse = z.object({ danmaku: Danmaku });
export const DanmakuListResponse = z.object({ danmaku: z.array(Danmaku) });

// ---- API errors ----

/** Every API error has this body: { error: { code, message, retryAfter? } }. */
export const ErrorCode = z.enum([
  "invalid_input", // 400: failed zod validation
  "unauthorized", // 401: missing or invalid cid cookie / admin session / Google sign-in
  "not_allowed", // 403: signed in, but not on the guestbook's whitelist
  "notes_closed", // 403: the admin closed the guestbooks
  "not_found", // 404
  "forbidden_content", // 422: profanity or a link
  "rate_limited", // 429: too fast; see retryAfter
  "server_error", // 500
  "danmaku_paused", // 503: the admin turned danmaku off
  "network_error", // client only: the request never got an answer
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

export const ApiError = z.object({
  code: ErrorCode,
  message: z.string(),
  /** Seconds until the next attempt is allowed (rate_limited). */
  retryAfter: z.number().optional(),
});
export type ApiError = z.infer<typeof ApiError>;

export const ApiErrorBody = z.object({ error: ApiError });

export const ERROR_STATUS: Record<ErrorCode, number> = {
  invalid_input: 400,
  unauthorized: 401,
  not_allowed: 403,
  notes_closed: 403,
  not_found: 404,
  forbidden_content: 422,
  rate_limited: 429,
  server_error: 500,
  danmaku_paused: 503,
  network_error: 0,
};

/** Default messages, written for the person using the page. */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  invalid_input: "內容格式不正確",
  unauthorized: "請重新整理頁面",
  not_allowed: "這個帳號不在 ENG 名單內",
  notes_closed: "留言已截止",
  not_found: "找不到資料",
  forbidden_content: "內容包含不當字詞或網址",
  rate_limited: "太快了，請稍後再試",
  server_error: "伺服器出了點問題，請稍後再試",
  danmaku_paused: "彈幕暫停中",
  network_error: "網路連線不穩，請再試一次",
};

// ---- Broadcast payloads (channel `live`, see lib/realtime.ts) ----

/** note:hide also covers un-hiding, so it carries the whole note. */
export const NoteHide = z.object({ note: Note, hidden: z.boolean() });
export type NoteHide = z.infer<typeof NoteHide>;

export const DanmakuRemove = z.object({ id: z.int().positive() });
export type DanmakuRemove = z.infer<typeof DanmakuRemove>;

export const PhotoFinal = z.object({ url: z.url() });
export type PhotoFinal = z.infer<typeof PhotoFinal>;
