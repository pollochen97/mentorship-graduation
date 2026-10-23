// Database rows → admin API shapes (#19). Like lib/supabase/rows.ts, plus whether the row is hidden
// and, for notes, the address of the Google account that wrote it (#55).
import "server-only";
import {
  DANMAKU_COLUMNS,
  NOTE_COLUMNS,
  toDanmaku,
  toNote,
  type DanmakuRow,
  type NoteRow,
} from "@/lib/supabase/rows";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { AdminDanmaku, AdminNote } from "./schemas";

export const ADMIN_DANMAKU_COLUMNS = `${DANMAKU_COLUMNS}, hidden_at` as const;
export const ADMIN_NOTE_COLUMNS = `${NOTE_COLUMNS}, hidden_at, user_id` as const;

type Hideable = { hidden_at: string | null };

export function toAdminDanmaku(row: DanmakuRow & Hideable): AdminDanmaku {
  return { ...toDanmaku(row), hidden: row.hidden_at !== null };
}

type Written = { user_id: string | null };

/**
 * Admin notes, with each writer's address looked up in Supabase Auth: one request per writer, and
 * there are a few dozen at most. Notes from before #55, or whose account is gone, have no address.
 */
export async function toAdminNotes(rows: (NoteRow & Hideable & Written)[]): Promise<AdminNote[]> {
  const ids = [...new Set(rows.flatMap((r) => r.user_id ?? []))];
  const auth = supabaseAdmin().auth.admin;
  const emails = new Map(
    await Promise.all(
      ids.map(async (id) => [id, (await auth.getUserById(id)).data.user?.email ?? null] as const),
    ),
  );
  return rows.map((row) => ({
    ...toNote(row),
    hidden: row.hidden_at !== null,
    email: (row.user_id && emails.get(row.user_id)) ?? null,
  }));
}
