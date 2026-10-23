// Mock mode (NEXT_PUBLIC_USE_MOCK=1): an in-memory API and fake live events, so the frontend runs
// without Supabase. Everything lives in this browser tab and resets on reload.
//
// In the browser console:
//   __mock.danmaku("你好")   a danmaku:new          __mock.remove(id)   a danmaku:remove
//   __mock.note("m1")        a note:new             __mock.hide(id)     a note:hide
//   __mock.pause() / resume()  settings:update     __mock.photo()      photo:final
//   __mock.offline() / online()  Realtime drops / comes back; danmaku then only reach pollers
//   __mock.list("m1")        ids of a guestbook's notes
//   __mock.auth("none" | "denied" | "allowed")   the guestbook's Google sign-in (#55); starts "allowed"
//   __mock.notes(false) / notes(true)            close / open the guestbooks (settings:update)
// Add ?mockLatency=1500 to the URL to make every mock request take 1.5 s (default 200 ms).
import type { ApiResult } from "../api";
import {
  ERROR_MESSAGES,
  type Danmaku,
  type DanmakuInput,
  type ErrorCode,
  type Note,
  type NoteInput,
  type NoteSection,
  type Settings,
} from "../schemas";
import { MOCK_BLOCKED, MOCK_DANMAKU, MOCK_NAMES, MOCK_NOTE_COUNTS, MOCK_NOTES } from "./data";

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "1";

/** A fake danmaku every few seconds while something is listening. */
const DANMAKU_EVERY_MS = 3000;
/** Same as the real rule for danmaku (spec 6.2); shorter than the real 30 s for notes, to test faster. */
const DANMAKU_GAP_S = 5;
const NOTE_GAP_S = 10;

type Emit = (event: string, payload: unknown) => void;
type SetStatus = (status: "connected" | "disconnected") => void;
let emit: Emit | null = null;
let setStatus: SetStatus | null = null;
let online = true;
/** Sends a live event, unless the fake connection is down. */
const send: Emit = (event, payload) => {
  if (online) emit?.(event, payload);
};

const pick = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];
const latency = () => Number(new URLSearchParams(location.search).get("mockLatency")) || 200;
const wait = () => new Promise((resolve) => setTimeout(resolve, latency()));
const fail = (code: ErrorCode, retryAfter?: number): ApiResult<never> => ({
  ok: false,
  error: { code, message: ERROR_MESSAGES[code], ...(retryAfter !== undefined && { retryAfter }) },
});

// ---- state ----

let nextDanmakuId = 1000;
const recentDanmaku: Danmaku[] = [];
let notes: Note[] | null = null;
const hiddenNotes = new Set<string>();
const settings: Settings = { danmakuEnabled: true, notesEnabled: true, finalPhotoUrl: null };
let lastDanmakuAt = 0;
let lastNoteAt = 0;

function makeNote(section: NoteSection, i: number, at = Date.now()): Note {
  return {
    id: crypto.randomUUID(),
    section,
    name: MOCK_NAMES[i % MOCK_NAMES.length],
    body: MOCK_NOTES[i % MOCK_NOTES.length],
    color: i % 4,
    createdAt: new Date(at).toISOString(),
  };
}

function allNotes() {
  notes ??= (Object.keys(MOCK_NOTE_COUNTS) as NoteSection[]).flatMap((section) =>
    Array.from({ length: MOCK_NOTE_COUNTS[section] }, (_, i) =>
      makeNote(section, i, Date.now() - (60 - i) * 60_000),
    ),
  );
  return notes;
}

function makeDanmaku(name: string, body: string): Danmaku {
  const danmaku = { id: nextDanmakuId++, name, body, createdAt: new Date().toISOString() };
  recentDanmaku.push(danmaku);
  if (recentDanmaku.length > 50) recentDanmaku.shift();
  return danmaku;
}

function blocked(body: string) {
  const squashed = body.replace(/[\s\p{P}\p{S}]/gu, "").toLowerCase();
  return MOCK_BLOCKED.some((word) => squashed.includes(word)) || /https?:|www\.|\.com/i.test(body);
}

function secondsLeft(last: number, gap: number) {
  return Math.ceil(gap - (Date.now() - last) / 1000);
}

// ---- Google sign-in (#55) ----

/** Signed out, signed in but off the whitelist, or signed in and allowed to write notes. */
export type MockAuth = "none" | "denied" | "allowed";
let auth: MockAuth = "allowed";
const authListeners = new Set<() => void>();

/** The fake sign-in that lib/auth.ts uses in mock mode. */
export const mockAuth = {
  get: () => auth,
  set(next: MockAuth) {
    auth = next;
    authListeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void) {
    authListeners.add(listener);
    return () => {
      authListeners.delete(listener);
    };
  },
};

// ---- API ----

export const mockApi = {
  // Reads take their snapshot before the delay, like a server answering a request made earlier.
  async fetchNotes(section: NoteSection): Promise<ApiResult<Note[]>> {
    const data = allNotes().filter((n) => n.section === section && !hiddenNotes.has(n.id));
    await wait();
    return { ok: true, data };
  },

  async sendNote(input: NoteInput): Promise<ApiResult<Note>> {
    await wait();
    if (auth === "none") return fail("unauthorized");
    if (auth === "denied") return fail("not_allowed");
    if (!settings.notesEnabled) return fail("notes_closed");
    if (blocked(input.body)) return fail("forbidden_content");
    const left = secondsLeft(lastNoteAt, NOTE_GAP_S);
    if (left > 0) return fail("rate_limited", left);
    lastNoteAt = Date.now();
    const note = {
      ...makeNote(input.section, 0),
      name: input.name,
      body: input.body,
      color: input.color,
    };
    allNotes().push(note);
    send("note:new", note);
    return { ok: true, data: note };
  },

  async sendDanmaku(input: DanmakuInput): Promise<ApiResult<Danmaku>> {
    await wait();
    if (!settings.danmakuEnabled) return fail("danmaku_paused");
    if (blocked(input.body)) return fail("forbidden_content");
    const left = secondsLeft(lastDanmakuAt, DANMAKU_GAP_S);
    if (left > 0) return fail("rate_limited", left);
    lastDanmakuAt = Date.now();
    const danmaku = makeDanmaku(input.name, input.body);
    send("danmaku:new", danmaku);
    return { ok: true, data: danmaku };
  },

  async fetchDanmakuSince(since: number): Promise<ApiResult<Danmaku[]>> {
    const data = recentDanmaku.filter((d) => d.id > since);
    await wait();
    return { ok: true, data };
  },

  async fetchSettings(): Promise<ApiResult<Settings>> {
    const data = { ...settings };
    await wait();
    return { ok: true, data };
  },
};

// ---- live events ----

const controls = {
  danmaku(body = pick(MOCK_DANMAKU), name = pick(MOCK_NAMES)) {
    send("danmaku:new", makeDanmaku(name, body));
  },
  remove(id: number) {
    send("danmaku:remove", { id });
  },
  note(section: NoteSection = "m1") {
    const note = makeNote(section, Math.floor(Math.random() * 100));
    allNotes().push(note);
    send("note:new", note);
  },
  hide(id: string, hidden = true) {
    const note = allNotes().find((n) => n.id === id);
    if (!note) return;
    if (hidden) hiddenNotes.add(id);
    else hiddenNotes.delete(id);
    send("note:hide", { note, hidden });
  },
  pause() {
    settings.danmakuEnabled = false;
    send("settings:update", { ...settings });
  },
  resume() {
    settings.danmakuEnabled = true;
    send("settings:update", { ...settings });
  },
  auth(state: MockAuth = "allowed") {
    mockAuth.set(state);
  },
  notes(open = true) {
    settings.notesEnabled = open;
    send("settings:update", { ...settings });
  },
  offline() {
    online = false;
    setStatus?.("disconnected");
  },
  online() {
    online = true;
    setStatus?.("connected");
  },
  list(section: NoteSection = "m1") {
    return allNotes()
      .filter((n) => n.section === section)
      .map((n) => n.id);
  },
  photo(url = `${location.origin}/mock/final-photo.jpg`) {
    settings.finalPhotoUrl = url;
    send("photo:final", { url });
  },
};

/** Starts fake live events; called by lib/realtime when the first listener subscribes. */
export function startMockLive(dispatch: Emit, status: SetStatus) {
  emit = dispatch;
  setStatus = status;
  online = true;
  (window as unknown as { __mock: typeof controls }).__mock = controls;
  const timer = window.setInterval(() => {
    if (settings.danmakuEnabled) controls.danmaku();
  }, DANMAKU_EVERY_MS);
  return () => {
    window.clearInterval(timer);
    emit = null;
    setStatus = null;
  };
}
