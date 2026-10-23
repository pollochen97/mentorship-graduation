"use client";

import { useEffect, useState } from "react";
import { fetchSettings } from "../api";
import { onLive } from "../realtime";
import type { Settings } from "../schemas";

const DEFAULTS: Settings = { danmakuEnabled: true, notesEnabled: false, finalPhotoUrl: null };

/**
 * Site settings. With `live` (the projector only, spec 3.5) they are kept up to date by
 * settings:update and photo:final; otherwise they are loaded once.
 */
export function useSettings({ live = false }: { live?: boolean } = {}) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Fields set by live events; they are newer than whatever the initial load returns.
    const fromLive: Partial<Settings> = {};
    fetchSettings().then((r) => {
      if (cancelled) return;
      if (r.ok) setSettings({ ...r.data, ...fromLive });
      setLoading(false);
    });
    if (!live) {
      return () => {
        cancelled = true;
      };
    }
    const offUpdate = onLive("settings:update", (next) => {
      Object.assign(fromLive, next);
      setSettings(next);
    });
    const offPhoto = onLive("photo:final", ({ url }) => {
      fromLive.finalPhotoUrl = url;
      setSettings((prev) => ({ ...prev, finalPhotoUrl: url }));
    });
    return () => {
      cancelled = true;
      offUpdate();
      offPhoto();
    };
  }, [live]);

  return { ...settings, loading };
}
