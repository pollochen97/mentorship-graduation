// Typed browser-side calls to our API (#4). Inputs are checked with the same zod schemas the server
// uses, and every failure comes back as an ApiError instead of throwing. Mock mode answers locally.
import type { z } from "zod";
import { mockApi, USE_MOCK } from "./mock";
import {
  ApiErrorBody,
  DanmakuInput,
  DanmakuListResponse,
  DanmakuResponse,
  ERROR_MESSAGES,
  ERROR_STATUS,
  Me,
  NoteInput,
  NoteResponse,
  NotesResponse,
  Settings,
  type ApiError,
  type Danmaku,
  type ErrorCode,
  type Note,
  type NoteSection,
} from "./schemas";
import { supabaseAuth } from "./supabase/browser";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

function failure(code: ErrorCode, message = ERROR_MESSAGES[code]): { ok: false; error: ApiError } {
  return { ok: false, error: { code, message } };
}

/** Best guess at an error code from the HTTP status, for error bodies that aren't ours. */
function codeForStatus(status: number): ErrorCode {
  const match = (Object.entries(ERROR_STATUS) as [ErrorCode, number][]).find(
    ([, s]) => s === status,
  );
  return match?.[0] ?? (status >= 500 ? "server_error" : "invalid_input");
}

async function request<S extends z.ZodType>(
  path: string,
  schema: S,
  init?: RequestInit,
): Promise<ApiResult<z.infer<S>>> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
    });
  } catch {
    return failure("network_error");
  }
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const parsed = ApiErrorBody.safeParse(body);
    return parsed.success
      ? { ok: false, error: parsed.data.error }
      : failure(codeForStatus(res.status));
  }
  const parsed = schema.safeParse(body);
  return parsed.success
    ? { ok: true, data: parsed.data }
    : failure("server_error", "回應格式不正確");
}

/** Validates input before sending, so the UI gets the same messages as the server would send. */
function validate<S extends z.ZodType>(schema: S, input: unknown): ApiResult<z.infer<S>> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };
  const issue = parsed.error.issues[0];
  return failure("invalid_input", issue ? `${issue.path.join(".")}：${issue.message}` : undefined);
}

export async function fetchNotes(section: NoteSection): Promise<ApiResult<Note[]>> {
  if (USE_MOCK) return mockApi.fetchNotes(section);
  const r = await request(`/api/notes?section=${section}`, NotesResponse);
  return r.ok ? { ok: true, data: r.data.notes } : r;
}

/** The guestbook's Google sign-in (#55, lib/auth.ts) as an Authorization header, or null when signed out. */
async function bearer() {
  const { data } = (await supabaseAuth()?.auth.getSession()) ?? { data: { session: null } };
  return data.session ? { authorization: `Bearer ${data.session.access_token}` } : null;
}

/** Needs a Google sign-in on the whitelist (#55): unauthorized when signed out, else not_allowed. */
export async function sendNote(input: NoteInput): Promise<ApiResult<Note>> {
  const valid = validate(NoteInput, input);
  if (!valid.ok) return valid;
  if (USE_MOCK) return mockApi.sendNote(valid.data);
  const headers = await bearer();
  if (!headers) return failure("unauthorized", "請先登入");
  const r = await request("/api/notes", NoteResponse, {
    method: "POST",
    headers,
    body: JSON.stringify(valid.data),
  });
  return r.ok ? { ok: true, data: r.data.note } : r;
}

/** Whether the Google account behind `token` may write notes (#55). Not used in mock mode. */
export async function fetchMe(token: string): Promise<ApiResult<Me>> {
  return request("/api/me", Me, { headers: { authorization: `Bearer ${token}` } });
}

export async function sendDanmaku(input: DanmakuInput): Promise<ApiResult<Danmaku>> {
  const valid = validate(DanmakuInput, input);
  if (!valid.ok) return valid;
  if (USE_MOCK) return mockApi.sendDanmaku(valid.data);
  const r = await request("/api/danmaku", DanmakuResponse, {
    method: "POST",
    body: JSON.stringify(valid.data),
  });
  return r.ok ? { ok: true, data: r.data.danmaku } : r;
}

/** Danmaku newer than `since` (an id), oldest first. Used by the projector's polling fallback. */
export async function fetchDanmakuSince(since: number): Promise<ApiResult<Danmaku[]>> {
  if (USE_MOCK) return mockApi.fetchDanmakuSince(since);
  const r = await request(`/api/danmaku?since=${since}`, DanmakuListResponse);
  return r.ok ? { ok: true, data: r.data.danmaku } : r;
}

export async function fetchSettings(): Promise<ApiResult<Settings>> {
  if (USE_MOCK) return mockApi.fetchSettings();
  return request("/api/settings", Settings);
}
