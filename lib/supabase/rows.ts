// Database rows (snake_case) → API shapes (camelCase, lib/schemas.ts), for the API routes (#5).
import type { Danmaku, Note, NoteSection, Settings } from "../schemas";

/** The columns of a notes row that the API shows; select exactly these, never client_id. */
export const NOTE_COLUMNS = "id, section, name, body, color, created_at";
export type NoteRow = {
  id: string;
  section: string;
  name: string;
  body: string;
  color: number;
  created_at: string;
};

export function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    // The table's check constraint only allows m1–m4.
    section: row.section as NoteSection,
    name: row.name,
    body: row.body,
    color: row.color,
    createdAt: row.created_at,
  };
}

/** The columns of a danmaku row that the API shows; select exactly these, never client_id or ip_hash. */
export const DANMAKU_COLUMNS = "id, name, body, created_at";
export type DanmakuRow = { id: number; name: string; body: string; created_at: string };

export function toDanmaku(row: DanmakuRow): Danmaku {
  return { id: row.id, name: row.name, body: row.body, createdAt: row.created_at };
}

/** Rows of the settings table (`select key, value`) → Settings, with defaults for missing keys. */
export function toSettings(rows: { key: string; value: unknown }[]): Settings {
  const value = (key: string) => rows.find((r) => r.key === key)?.value;
  const enabled = value("danmaku_enabled");
  const photo = value("final_photo_url");
  return {
    danmakuEnabled: typeof enabled === "boolean" ? enabled : true,
    finalPhotoUrl: typeof photo === "string" ? photo : null,
  };
}
