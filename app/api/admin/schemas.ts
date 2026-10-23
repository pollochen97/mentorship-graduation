// Request and response shapes of the admin API (#19), shared by the routes and app/admin. Kept here
// rather than in lib/schemas.ts: only the admin page uses them, so they aren't part of the contract.
import { z } from "zod";
import { Danmaku, Note, NoteSection, Settings } from "@/lib/schemas";

// POST /api/admin/login   (LoginInput)     → 204, sets the admin cookie
// POST /api/admin/logout                   → 204, clears it
// GET  /api/admin/danmaku                  → AdminDanmakuList: the newest 50, hidden ones included
// PATCH /api/admin/danmaku/[id] (HideInput) → { danmaku }; hiding sends danmaku:remove
// GET  /api/admin/notes?section=m1         → AdminNoteList: newest first, hidden ones included
// PATCH /api/admin/notes/[id]   (HideInput) → { note }; sends note:hide
// GET  /api/admin/settings                 → Settings
// PUT  /api/admin/settings (SettingsInput) → Settings; sends settings:update. Either switch, or both

export const LoginInput = z.object({ password: z.string().min(1, "請輸入密碼") });

export const HideInput = z.object({ hidden: z.boolean() });

export const SettingsInput = Settings.pick({ danmakuEnabled: true, notesEnabled: true })
  .partial()
  .refine((s) => Object.keys(s).length > 0, "沒有要修改的設定");

export const AdminDanmaku = Danmaku.extend({ hidden: z.boolean() });
export type AdminDanmaku = z.infer<typeof AdminDanmaku>;

/** `email`: the Google account that wrote the note (#55); null for notes from before sign-in. */
export const AdminNote = Note.extend({ hidden: z.boolean(), email: z.string().nullable() });
export type AdminNote = z.infer<typeof AdminNote>;

export const AdminDanmakuList = z.object({ danmaku: z.array(AdminDanmaku) });
export const AdminDanmakuResponse = z.object({ danmaku: AdminDanmaku });
export const AdminNoteList = z.object({ notes: z.array(AdminNote) });
export const AdminNoteResponse = z.object({ note: AdminNote });

/** Optional ?section= filter for the notes list. */
export const NotesFilter = NoteSection.optional();
