// Database rows → admin API shapes (#19). Like lib/supabase/rows.ts, plus whether the row is hidden.
import "server-only";
import {
  DANMAKU_COLUMNS,
  NOTE_COLUMNS,
  toDanmaku,
  toNote,
  type DanmakuRow,
  type NoteRow,
} from "@/lib/supabase/rows";
import type { AdminDanmaku, AdminNote } from "./schemas";

export const ADMIN_DANMAKU_COLUMNS = `${DANMAKU_COLUMNS}, hidden_at` as const;
export const ADMIN_NOTE_COLUMNS = `${NOTE_COLUMNS}, hidden_at` as const;

type Hideable = { hidden_at: string | null };

export function toAdminDanmaku(row: DanmakuRow & Hideable): AdminDanmaku {
  return { ...toDanmaku(row), hidden: row.hidden_at !== null };
}

export function toAdminNote(row: NoteRow & Hideable): AdminNote {
  return { ...toNote(row), hidden: row.hidden_at !== null };
}
