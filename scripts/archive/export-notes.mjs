#!/usr/bin/env node
// Archive (spec 3.6): copies the guestbook notes out of Supabase into content/archive.json, so the
// site can run read-only with NEXT_PUBLIC_DATA_SOURCE=archive and Supabase can be shut down.
// Read-only on the database. Only notes nobody hid, and only what the site already shows: section,
// name, body, colour, time. No client_id, user_id or email. Danmaku are not kept (spec 3.6).
//
//   node --env-file=.env.production.local scripts/archive/export-notes.mjs
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY of the production project.
import { createClient } from "@supabase/supabase-js";
import { writeFile } from "node:fs/promises";

const OUT = new URL("../../content/archive.json", import.meta.url);
const PAGE = 1000;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY（用 --env-file 指定正式站的 env 檔）",
  );
  process.exit(2);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const rows = [];
for (let from = 0; ; from += PAGE) {
  const { data, error } = await supabase
    .from("notes")
    .select("id, section, name, body, color, created_at")
    .is("hidden_at", null)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .range(from, from + PAGE - 1);
  if (error) {
    console.error("讀取 notes 失敗：", error.message);
    process.exit(1);
  }
  rows.push(...data);
  if (data.length < PAGE) break;
}

// Same shape as the API's Note (lib/schemas.ts), so the archive reads like a GET /api/notes.
const notes = rows.map((r) => ({
  id: r.id,
  section: r.section,
  name: r.name,
  body: r.body,
  color: r.color,
  createdAt: new Date(r.created_at).toISOString(),
}));

await writeFile(OUT, JSON.stringify({ notes }, null, 2) + "\n");

const counts = Object.groupBy(notes, (n) => n.section);
console.log(
  `已寫入 content/archive.json：${notes.length} 則`,
  Object.fromEntries(Object.entries(counts).map(([s, list]) => [s, list.length])),
);
