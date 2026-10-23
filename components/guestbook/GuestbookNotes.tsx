"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useBook } from "@/components/book/BookContext";
import type { GuestbookSection } from "@/components/book/types";
import { useNotes, useSettings } from "@/lib/hooks";
import { pagesFor } from "./paging";

function useSection(section: GuestbookSection, live: boolean) {
  const { notes, post, loading, error } = useNotes(section, { live });
  const { setGuestbookPages } = useBook();
  const pages = pagesFor(notes.length);
  // Notes that were already there when the guestbook first loaded, or that have flown in since.
  const settled = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (loading) return;
    settled.current ??= new Set(notes.map((n) => n.id));
    setGuestbookPages(section, pages);
  }, [loading, notes, pages, section, setGuestbookPages]);

  const shouldFly = useCallback((id: string) => {
    const seen = settled.current;
    if (!seen || seen.has(id)) return false;
    seen.add(id);
    return true;
  }, []);

  return useMemo(
    () => ({ notes, post, loading, error, pages, shouldFly }),
    [notes, post, loading, error, pages, shouldFly],
  );
}

type SectionNotes = ReturnType<typeof useSection>;

type Guestbooks = {
  sections: Record<GuestbookSection, SectionNotes>;
  /** Whether the admin has the guestbooks open for new notes (#55); null until the settings load. */
  enabled: boolean | null;
};

const NotesContext = createContext<Guestbooks | null>(null);

/**
 * Loads each guestbook once for all of its pages, which BookShell keeps mounted side by side, and
 * reports how many pages each one needs. Only the projector follows them live (spec 3.5).
 */
export function GuestbookNotes({ children }: { children: ReactNode }) {
  const { isProjector } = useBook();
  const m1 = useSection("m1", isProjector);
  const m2 = useSection("m2", isProjector);
  const m3 = useSection("m3", isProjector);
  const m4 = useSection("m4", isProjector);
  const { notesEnabled, loading } = useSettings({ live: isProjector });
  const enabled = loading ? null : notesEnabled;
  const value = useMemo(
    () => ({ sections: { m1, m2, m3, m4 }, enabled }),
    [m1, m2, m3, m4, enabled],
  );
  return <NotesContext value={value}>{children}</NotesContext>;
}

/**
 * One guestbook's notes, oldest first, and `post` to add one.
 * `shouldFly(id)` is true once for a note that arrived after the first load (posted here, or live on
 * the projector), so it flies in from the pad instead of just appearing.
 * `enabled`: whether new notes are taken at all (#55).
 */
export function useGuestbook(section: GuestbookSection) {
  const value = useContext(NotesContext);
  if (!value) throw new Error("useGuestbook() must be used inside <GuestbookNotes>");
  return { ...value.sections[section], enabled: value.enabled };
}
