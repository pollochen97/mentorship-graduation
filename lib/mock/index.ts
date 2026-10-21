// Mock mode (NEXT_PUBLIC_USE_MOCK=1): an in-memory API and fake live events, so the frontend runs
// without Supabase. Everything lives in this browser tab and resets on reload.
//
// In the browser console:
//   __mock.danmaku("你好")   a danmaku:new          __mock.remove(id)   a danmaku:remove
//   __mock.note("m1")        a note:new             __mock.hide(id)     a note:hide
//   __mock.pause() / resume()  settings:update     __mock.photo()      photo:final
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
let emit: Emit | null = null;

const pick = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const fail = (code: ErrorCode, retryAfter?: number): ApiResult<never> => ({
  ok: false,
  error: { code, message: ERROR_MESSAGES[code], ...(retryAfter !== undefined && { retryAfter }) },
});

// ---- state ----

let nextDanmakuId = 1000;
const recentDanmaku: Danmaku[] = [];
let notes: Note[] | null = null;
const settings: Settings = { danmakuEnabled: true, finalPhotoUrl: null };
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

// ---- API ----

export const mockApi = {
  async fetchNotes(section: NoteSection): Promise<ApiResult<Note[]>> {
    await wait(200);
    return { ok: true, data: allNotes().filter((n) => n.section === section) };
  },

  async sendNote(input: NoteInput): Promise<ApiResult<Note>> {
    await wait(300);
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
    emit?.("note:new", note);
    return { ok: true, data: note };
  },

  async sendDanmaku(input: DanmakuInput): Promise<ApiResult<Danmaku>> {
    await wait(300);
    if (!settings.danmakuEnabled) return fail("danmaku_paused");
    if (blocked(input.body)) return fail("forbidden_content");
    const left = secondsLeft(lastDanmakuAt, DANMAKU_GAP_S);
    if (left > 0) return fail("rate_limited", left);
    lastDanmakuAt = Date.now();
    const danmaku = makeDanmaku(input.name, input.body);
    emit?.("danmaku:new", danmaku);
    return { ok: true, data: danmaku };
  },

  async fetchDanmakuSince(since: number): Promise<ApiResult<Danmaku[]>> {
    await wait(200);
    return { ok: true, data: recentDanmaku.filter((d) => d.id > since) };
  },

  async fetchSettings(): Promise<ApiResult<Settings>> {
    await wait(200);
    return { ok: true, data: { ...settings } };
  },
};

// ---- live events ----

const controls = {
  danmaku(body = pick(MOCK_DANMAKU), name = pick(MOCK_NAMES)) {
    emit?.("danmaku:new", makeDanmaku(name, body));
  },
  remove(id: number) {
    emit?.("danmaku:remove", { id });
  },
  note(section: NoteSection = "m1") {
    const note = makeNote(section, Math.floor(Math.random() * 100));
    allNotes().push(note);
    emit?.("note:new", note);
  },
  hide(id: string, hidden = true) {
    const note = allNotes().find((n) => n.id === id);
    if (note) emit?.("note:hide", { note, hidden });
  },
  pause() {
    settings.danmakuEnabled = false;
    emit?.("settings:update", { ...settings });
  },
  resume() {
    settings.danmakuEnabled = true;
    emit?.("settings:update", { ...settings });
  },
  photo(url = `${location.origin}/mock/final-photo.jpg`) {
    settings.finalPhotoUrl = url;
    emit?.("photo:final", { url });
  },
};

/** Starts fake live events; called by lib/realtime when the first listener subscribes. */
export function startMockLive(dispatch: Emit) {
  emit = dispatch;
  (window as unknown as { __mock: typeof controls }).__mock = controls;
  const timer = window.setInterval(() => {
    if (settings.danmakuEnabled) controls.danmaku();
  }, DANMAKU_EVERY_MS);
  return () => {
    window.clearInterval(timer);
    emit = null;
  };
}
