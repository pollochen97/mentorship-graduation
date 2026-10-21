// Live updates over Supabase Realtime Broadcast (#4). One private channel, `live`, shared by every
// hook on the page. Only the server sends (lib/supabase, #5); browsers only listen.
// In mock mode (NEXT_PUBLIC_USE_MOCK=1) the events come from lib/mock instead.
import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import { startMockLive, USE_MOCK } from "./mock";
import { Danmaku, DanmakuRemove, Note, NoteHide, PhotoFinal, Settings } from "./schemas";

export const LIVE_CHANNEL = "live";

/** Every Broadcast event and the schema of its payload. */
export const LIVE_EVENTS = {
  "note:new": Note,
  "note:hide": NoteHide,
  "danmaku:new": Danmaku,
  "danmaku:remove": DanmakuRemove,
  "settings:update": Settings,
  "photo:final": PhotoFinal,
} as const;

export type LiveEvent = keyof typeof LIVE_EVENTS;
export type LivePayload<E extends LiveEvent> = z.infer<(typeof LIVE_EVENTS)[E]>;
export type LiveStatus = "connecting" | "connected" | "disconnected";

type Handler = (payload: never) => void;

const handlers = new Map<LiveEvent, Set<Handler>>();
const statusListeners = new Set<(status: LiveStatus) => void>();
let status: LiveStatus = "connecting";
let stop: (() => void) | null = null;

function isLiveEvent(event: string): event is LiveEvent {
  return Object.hasOwn(LIVE_EVENTS, event);
}

/** Hands an incoming event to its listeners, dropping payloads that don't match the schema. */
export function dispatchLive(event: string, payload: unknown) {
  if (!isLiveEvent(event)) return;
  const parsed = LIVE_EVENTS[event].safeParse(payload);
  if (!parsed.success) {
    console.warn(`[live] ignored a malformed ${event} payload`, parsed.error.issues);
    return;
  }
  handlers.get(event)?.forEach((handler) => (handler as (p: unknown) => void)(parsed.data));
}

function setStatus(next: LiveStatus) {
  if (next === status) return;
  status = next;
  statusListeners.forEach((listener) => listener(next));
}

let client: SupabaseClient | null = null;

function connect(): () => void {
  if (USE_MOCK) {
    setStatus("connected");
    return startMockLive(dispatchLive);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn(
      "[live] NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are not set; set NEXT_PUBLIC_USE_MOCK=1 to use fake data",
    );
    setStatus("disconnected");
    return () => {};
  }
  client ??= createClient(url, key, { auth: { persistSession: false } });
  const supabase = client;
  let channel: RealtimeChannel | null = null;
  let closed = false;
  setStatus("connecting");
  // Private channels are authorised by RLS on realtime.messages, so send the auth token first.
  supabase.realtime.setAuth().then(() => {
    if (closed) return;
    channel = supabase
      .channel(LIVE_CHANNEL, { config: { private: true } })
      .on("broadcast", { event: "*" }, ({ event, payload }) => dispatchLive(event, payload))
      .subscribe((state) => setStatus(state === "SUBSCRIBED" ? "connected" : "disconnected"));
  });
  return () => {
    closed = true;
    if (channel) supabase.removeChannel(channel);
  };
}

function listenerCount() {
  let n = statusListeners.size;
  handlers.forEach((set) => (n += set.size));
  return n;
}

// Connect on the first listener and disconnect after the last one leaves.
function retain() {
  stop ??= connect();
}

function release() {
  if (listenerCount() > 0 || !stop) return;
  stop();
  stop = null;
  status = "connecting";
}

/** Listen to one Broadcast event. Returns a function that stops listening. */
export function onLive<E extends LiveEvent>(event: E, handler: (payload: LivePayload<E>) => void) {
  let set = handlers.get(event);
  if (!set) handlers.set(event, (set = new Set()));
  set.add(handler as Handler);
  retain();
  return () => {
    set.delete(handler as Handler);
    release();
  };
}

/** Follow the connection state, e.g. to fall back to polling while disconnected. Called right away too. */
export function onLiveStatus(listener: (status: LiveStatus) => void) {
  statusListeners.add(listener);
  retain();
  listener(status);
  return () => {
    statusListeners.delete(listener);
    release();
  };
}
