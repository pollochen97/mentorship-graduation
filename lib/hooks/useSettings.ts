"use client";

import { useEffect, useState } from "react";
import { fetchSettings } from "../api";
import { onLive } from "../realtime";
import type { Settings } from "../schemas";

const DEFAULTS: Settings = { danmakuEnabled: true, finalPhotoUrl: null };

/** Site settings, kept up to date by settings:update and photo:final. */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchSettings().then((r) => {
      if (cancelled) return;
      if (r.ok) setSettings(r.data);
      setLoading(false);
    });
    const offUpdate = onLive("settings:update", setSettings);
    const offPhoto = onLive("photo:final", ({ url }) =>
      setSettings((prev) => ({ ...prev, finalPhotoUrl: url })),
    );
    return () => {
      cancelled = true;
      offUpdate();
      offPhoto();
    };
  }, []);

  return { ...settings, loading };
}
