"use client";

import { createContext, useContext, useState } from "react";
import type { GuestbookSection } from "./types";

type BookContextValue = {
  /**
   * Whether this is the projector (spec 3.5), checked on the server from the `screen` cookie. Only
   * the projector subscribes to Realtime: pass it on as `useNotes(section, { live: isProjector })`
   * and `useSettings({ live: isProjector })`.
   */
  isProjector: boolean;
  /** Whether danmaku is shown on this screen; the D key and the toolbar toggle it (projector only). */
  danmakuOn: boolean;
  setDanmakuOn: (on: boolean) => void;
  /** Flip to the first page of a chapter, e.g. goToChapter("group-photo") when the photo arrives. */
  goToChapter: (key: string) => void;
  /** How many guestbook pages a chapter needs; the guestbook (#14) reports this as notes come in. */
  setGuestbookPages: (section: GuestbookSection, pages: number) => void;
};

export const BookContext = createContext<BookContextValue | null>(null);

/** Book-wide state and actions. Only works inside BookShell. */
export function useBook() {
  const value = useContext(BookContext);
  if (!value) throw new Error("useBook() must be used inside <BookShell>");
  return value;
}

export const PageContext = createContext({ active: false, near: false });

/** True while this page is the one showing, e.g. to start an animation only when it can be seen. */
export function usePageActive() {
  return useContext(PageContext).active;
}

/**
 * True once this page is showing or next to it, and from then on. Every page is mounted at once, so
 * pages hold back their photos until then; otherwise opening the book would download them all.
 */
export function usePageNear() {
  const { near } = useContext(PageContext);
  const [seen, setSeen] = useState(near);
  if (near && !seen) setSeen(true);
  return near || seen;
}
