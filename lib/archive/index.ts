// Archive mode (NEXT_PUBLIC_DATA_SOURCE=archive, spec 3.6): the site after the event, read-only and
// without Supabase. The guestbooks show the notes exported to content/archive.json
// (scripts/archive/export-notes.mjs); writing is closed, danmaku are off, nothing subscribes to
// Realtime and nobody signs in. Supabase's env vars can then be removed and the project shut down.
// The group photo is not archived: it stays off the public repo, so its page says where to find it.
import type { ApiResult } from "../api";
import {
  ERROR_MESSAGES,
  type ErrorCode,
  type Note,
  type NoteSection,
  type Settings,
} from "../schemas";
import { archivedNotes } from "./notes";

export const ARCHIVE = process.env.NEXT_PUBLIC_DATA_SOURCE === "archive";

export const ARCHIVE_SETTINGS: Settings = {
  danmakuEnabled: false,
  notesEnabled: false,
  finalPhotoUrl: null,
};

const fail = (code: ErrorCode): ApiResult<never> => ({
  ok: false,
  error: { code, message: ERROR_MESSAGES[code] },
});

// Loaded on first use, so the notes stay out of the bundle of a site that isn't archived.
let file: Promise<unknown> | null = null;
const load = () => (file ??= import("@/content/archive.json").then((m) => m.default));

/** Answers lib/api.ts's calls in archive mode. */
export const archiveApi = {
  async fetchNotes(section: NoteSection): Promise<ApiResult<Note[]>> {
    try {
      return { ok: true, data: archivedNotes(await load(), section) };
    } catch (error) {
      console.error("[archive] content/archive.json could not be read", error);
      return fail("server_error");
    }
  },
  async sendNote(): Promise<ApiResult<Note>> {
    return fail("notes_closed");
  },
  async sendDanmaku(): Promise<ApiResult<never>> {
    return fail("danmaku_paused");
  },
  async fetchDanmakuSince(): Promise<ApiResult<never[]>> {
    return { ok: true, data: [] };
  },
  async fetchSettings(): Promise<ApiResult<Settings>> {
    return { ok: true, data: ARCHIVE_SETTINGS };
  },
};
