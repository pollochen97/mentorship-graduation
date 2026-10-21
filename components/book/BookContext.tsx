"use client";

import { createContext, useContext } from "react";
import type { GuestbookSection } from "./types";

type BookContextValue = {
  /** Whether danmaku is shown on this screen; the D key and the toolbar toggle it. */
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

export const PageContext = createContext({ active: false });

/** True while this page is the one showing, e.g. to start an animation only when it can be seen. */
export function usePageActive() {
  return useContext(PageContext).active;
}
