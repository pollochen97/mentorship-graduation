"use client";

import { useEffect, useRef } from "react";
import { fetchDanmakuSince } from "../api";
import { onLive, onLiveStatus } from "../realtime";
import type { Danmaku } from "../schemas";

const POLL_MS = 3000;

/**
 * Calls `onMessage` for every new danmaku and `onRemove` when the admin takes one down.
 * While Realtime is disconnected it polls GET /api/danmaku?since= every 3 seconds instead (spec 7.3),
 * so messages keep coming either way. Each danmaku is delivered once.
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
    let lastId = 0;
    const seen = new Set<number>();
    const deliver = (danmaku: Danmaku) => {
      if (seen.has(danmaku.id)) return;
      seen.add(danmaku.id);
      if (seen.size > 500) seen.delete(seen.values().next().value!);
      lastId = Math.max(lastId, danmaku.id);
      callbacks.current.onMessage(danmaku);
    };

    let poll: number | undefined;
    const pollOnce = async () => {
      const r = await fetchDanmakuSince(lastId);
      if (!r.ok) return;
      // Nothing received yet: start from the newest instead of replaying the backlog.
      if (lastId === 0) lastId = Math.max(0, ...r.data.map((d) => d.id));
      else r.data.forEach(deliver);
    };

    const offNew = onLive("danmaku:new", deliver);
    const offRemove = onLive("danmaku:remove", ({ id }) => callbacks.current.onRemove?.(id));
    const offStatus = onLiveStatus((status) => {
      if (status === "connected") {
        window.clearInterval(poll);
        poll = undefined;
      } else if (status === "disconnected" && poll === undefined) {
        poll = window.setInterval(pollOnce, POLL_MS);
      }
    });
    return () => {
      offNew();
      offRemove();
      offStatus();
      window.clearInterval(poll);
    };
  }, []);
}
