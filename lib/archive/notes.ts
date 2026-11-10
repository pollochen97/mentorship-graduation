// Reads content/archive.json (spec 3.6), written by scripts/archive/export-notes.mjs. Kept apart from
// lib/archive/index.ts so `npm test` can run it without the bundler.
import { z } from "zod";
import { Note, type NoteSection } from "../schemas.ts";

const ArchiveFile = z.object({ notes: z.array(Note) });

/** The archived notes of one guestbook, oldest first, like GET /api/notes. Throws on a malformed file. */
export function archivedNotes(file: unknown, section: NoteSection): Note[] {
  return ArchiveFile.parse(file)
    .notes.filter((n) => n.section === section)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}
