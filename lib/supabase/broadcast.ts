// Sends Broadcast events to the projector (#5). Only the server sends: it posts to Realtime's REST
// endpoint with the service role, which may write to the private `live` channel; browsers can't.
import "server-only";
import { LIVE_CHANNEL, LIVE_EVENTS, type LiveEvent, type LivePayload } from "../realtime";

/**
 * Sends one event on the `live` channel. Resolves false instead of throwing when it fails: the write
 * has already succeeded by then, and the projector catches up on its own (polling, reload).
 */
export async function broadcast<E extends LiveEvent>(event: E, payload: LivePayload<E>) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("[broadcast] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
    return false;
  }
  // Same check the projector does on arrival, so a bad payload fails here, where it's easy to see.
  const parsed = LIVE_EVENTS[event].safeParse(payload);
  if (!parsed.success) {
    console.error(`[broadcast] ${event} payload doesn't match its schema`, parsed.error.issues);
    return false;
  }
  try {
    const res = await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: key,
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        messages: [{ topic: LIVE_CHANNEL, event, payload: parsed.data, private: true }],
      }),
    });
    if (res.ok) return true;
    console.error(`[broadcast] ${event} failed: ${res.status} ${await res.text()}`);
  } catch (error) {
    console.error(`[broadcast] ${event} failed`, error);
  }
  return false;
}
