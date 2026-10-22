"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchNotes, sendNote, type ApiResult } from "../api";
import { onLive } from "../realtime";
import type { ApiError, Note, NoteInput, NoteSection } from "../schemas";

const byTime = (a: Note, b: Note) => a.createdAt.localeCompare(b.createdAt);

/** Adds notes that aren't there yet (live events and the initial load can arrive in either order). */
function merge(list: Note[], incoming: Note[]) {
  const ids = new Set(list.map((n) => n.id));
  const added = incoming.filter((n) => !ids.has(n.id));
  return added.length ? [...list, ...added].sort(byTime) : list;
}

type State = { section: NoteSection; notes: Note[]; loaded: boolean; error: ApiError | null };

const fresh = (section: NoteSection): State => ({ section, notes: [], loaded: false, error: null });

/**
 * The visible notes of one guestbook, oldest first.
 * With `live` (the projector only, spec 3.5) they are kept up to date by note:new / note:hide;
 * otherwise they are loaded once and only the visitor's own notes are added.
 * `post` sends a note and resolves with the result; on success the note is already in `notes`.
 */
export function useNotes(section: NoteSection, { live = false }: { live?: boolean } = {}) {
  // Tagged with its section, so switching sections never shows the previous section's notes.
  const [state, setState] = useState(() => fresh(section));
  const current = state.section === section ? state : fresh(section);
  // Notes added since the current load started (live or posted here); the load's answer can't have them.
  const addedSinceLoad = useRef<Note[]>([]);

  useEffect(() => {
    let cancelled = false;
    // Notes hidden by note:hide, so a slower initial load can't bring them back.
    const hiddenIds = new Set<string>();
    const added: Note[] = (addedSinceLoad.current = []);
    // Updates only this section's state, starting over if the state still holds another section.
    const update = (fn: (s: State) => Partial<State>) =>
      setState((prev) => {
        const base = prev.section === section ? prev : fresh(section);
        return { ...base, ...fn(base) };
      });

    // The answer replaces the list rather than merging into it: after switching to live, the old list
    // may still hold notes that were hidden in the meantime.
    fetchNotes(section).then((r) => {
      if (cancelled) return;
      const visible = (n: Note) => n.section === section && !hiddenIds.has(n.id);
      update(() =>
        r.ok
          ? {
              notes: merge(r.data.filter(visible).sort(byTime), added.filter(visible)),
              loaded: true,
              error: null,
            }
          : { error: r.error, loaded: true },
      );
    });
    if (!live) {
      return () => {
        cancelled = true;
      };
    }
    const offNew = onLive("note:new", (note) => {
      if (note.section !== section) return;
      added.push(note);
      update((s) => ({ notes: merge(s.notes, [note]) }));
    });
    const offHide = onLive("note:hide", ({ note, hidden }) => {
      if (note.section !== section) return;
      if (hidden) hiddenIds.add(note.id);
      else {
        hiddenIds.delete(note.id);
        added.push(note);
      }
      update((s) => ({
        notes: hidden ? s.notes.filter((n) => n.id !== note.id) : merge(s.notes, [note]),
      }));
    });
    return () => {
      cancelled = true;
      offNew();
      offHide();
    };
  }, [section, live]);

  const post = useCallback(
    async (input: Omit<NoteInput, "section">): Promise<ApiResult<Note>> => {
      const r = await sendNote({ ...input, section });
      if (r.ok) {
        addedSinceLoad.current.push(r.data);
        setState((prev) =>
          prev.section === section ? { ...prev, notes: merge(prev.notes, [r.data]) } : prev,
        );
      }
      return r;
    },
    [section],
  );

  return { notes: current.notes, post, loading: !current.loaded, error: current.error };
}
