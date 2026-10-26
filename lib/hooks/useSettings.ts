"use client";

import { useEffect, useState } from "react";
import { fetchSettings } from "../api";
import { onLive, onLiveStatus } from "../realtime";
import type { Settings } from "../schemas";

const DEFAULTS: Settings = { danmakuEnabled: true, notesEnabled: false, finalPhotoUrl: null };

/** While Realtime is down, how often the projector asks for the settings instead. */
const POLL_MS = 5000;

/**
 * Site settings. With `live` (the projector only, spec 3.5) they are kept up to date by
 * settings:update and photo:final; otherwise they are loaded once.
 * Live events sent while the connection is down are lost, so the projector also loads the settings
 * again each time Realtime (re)connects, and every few seconds while it is down (#64): a photo
 * cleared or uploaded during a dropout still reaches the screen.
 */
export function useSettings({ live = false }: { live?: boolean } = {}) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Fields set by live events; they are newer than whatever the initial load returns.
    const fromLive: Partial<Settings> = {};
    // Set once a reload (below) has answered: the initial load, sent earlier, is then older.
    let reloaded = false;
    fetchSettings().then((r) => {
      if (cancelled) return;
      if (r.ok && !reloaded) setSettings({ ...r.data, ...fromLive });
      setLoading(false);
    });
    if (!live) {
      return () => {
        cancelled = true;
      };
    }

    // Counts live events, so a reload answered after one of them (and so maybe older) is dropped.
    let events = 0;
    const reload = async () => {
      const before = events;
      const r = await fetchSettings();
      if (cancelled || !r.ok || events !== before) return;
      reloaded = true;
      setSettings(r.data);
      setLoading(false);
    };

    const offUpdate = onLive("settings:update", (next) => {
      events++;
      Object.assign(fromLive, next);
      setSettings(next);
    });
    const offPhoto = onLive("photo:final", ({ url }) => {
      events++;
      fromLive.finalPhotoUrl = url;
      setSettings((prev) => ({ ...prev, finalPhotoUrl: url }));
    });

    let poll: number | undefined;
    const offStatus = onLiveStatus((status) => {
      if (status === "disconnected") {
        poll ??= window.setInterval(reload, POLL_MS);
        return;
      }
      window.clearInterval(poll);
      poll = undefined;
      // Also on the first connect: changes made between the initial load and subscribing are only
      // in the database.
      if (status === "connected") void reload();
    });

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      offUpdate();
      offPhoto();
      offStatus();
    };
  }, [live]);

  return { ...settings, loading };
}
