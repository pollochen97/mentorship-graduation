"use client";

import { useEffect, useRef } from "react";
import { fetchDanmakuSince } from "../api";
import { onLive, onLiveStatus } from "../realtime";
import type { Danmaku } from "../schemas";

const POLL_MS = 3000;

/**
 * Calls `onMessage` for every new danmaku and `onRemove` when the admin takes one down.
 * While Realtime is disconnected it polls GET /api/danmaku?since= every 3 seconds instead (spec 7.3),
 * and after reconnecting it fetches what was sent in between, so messages keep coming either way.
 * Each danmaku is delivered once; danmaku sent before the page loaded are not.
 */
export function useDanmakuStream(
  onMessage: (danmaku: Danmaku) => void,
  onRemove?: (id: number) => void,
) {
  // Keep the latest callbacks without re-subscribing on every render.
  const callbacks = useRef({ onMessage, onRemove });
  useEffect(() => {
    callbacks.current = { onMessage, onRemove };
  });

  useEffect(() => {
    let closed = false;
    // Everything up to `cursor` has been delivered or skipped as history; fetches ask for what follows.
    let cursor = 0;
    // False until the first answer, which only sets the starting point: older danmaku are history.
    let primed = false;
    // True while live events may have missed something: from mount, and from each disconnect until
    // a fetch made after reconnecting has answered. Live events only move the cursor when it is false.
    let gap = true;
    let connected = false;
    // Bumped on every reconnect, so an answer to a request sent before it can't close the gap.
    let session = 0;
    let newestLive = 0;

    const seen = new Set<number>();
    const deliver = (danmaku: Danmaku) => {
      if (seen.has(danmaku.id)) return;
      seen.add(danmaku.id);
      if (seen.size > 500) seen.delete(seen.values().next().value!);
      callbacks.current.onMessage(danmaku);
    };
    const onNew = (danmaku: Danmaku) => {
      newestLive = Math.max(newestLive, danmaku.id);
      if (!gap) cursor = Math.max(cursor, danmaku.id);
      deliver(danmaku);
    };

    let poll: number | undefined;
    const startPolling = () => {
      poll ??= window.setInterval(sync, POLL_MS);
    };
    const stopPolling = () => {
      window.clearInterval(poll);
      poll = undefined;
    };

    // One request at a time, so the cursor only ever moves past answers that have been handled.
    let fetching = false;
    let again = false;
    async function sync() {
      if (fetching) {
        again = true;
        return;
      }
      fetching = true;
      const sentIn = connected ? session : -1;
      const r = await fetchDanmakuSince(cursor);
      fetching = false;
      if (closed) return;
      if (r.ok) {
        if (primed) r.data.forEach(deliver);
        primed = true;
        cursor = Math.max(cursor, ...r.data.map((d) => d.id));
        // Realtime was up before this request, so whatever came after its answer arrived live.
        if (connected && sentIn === session) {
          gap = false;
          cursor = Math.max(cursor, newestLive);
          stopPolling();
        }
      }
      if (again) {
        again = false;
        void sync();
      }
    }

    const offNew = onLive("danmaku:new", onNew);
    const offRemove = onLive("danmaku:remove", ({ id }) => callbacks.current.onRemove?.(id));
    const offStatus = onLiveStatus((status) => {
      if (status === "connected") {
        connected = true;
        session++;
        // Fill in what was missed; polling stops once that answer is in.
        void sync();
      } else {
        connected = false;
        gap = true;
      }
      if (gap) startPolling();
    });
    // Set the starting point now, so danmaku sent from here on count as new even if Realtime is down.
    if (!fetching) void sync();
    return () => {
      closed = true;
      offNew();
      offRemove();
      offStatus();
      stopPolling();
    };
  }, []);
}
