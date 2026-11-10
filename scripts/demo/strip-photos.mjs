#!/usr/bin/env node
// For the public demo site's build (`npm run build:demo`, NEXT_PUBLIC_CONTENT=demo): deletes
// public/photos before `next build`, so the participants' photos aren't served from the demo even by
// direct URL. The demo's pages don't use them (next.config.ts swaps in content/demo/).
// Only runs on Vercel, so a local `npm run build:demo` can't wipe your working tree.
// Fails the build first unless the demo also runs in mock mode: without NEXT_PUBLIC_USE_MOCK=1 the
// pages would call the real API, and a Vercel project that has Supabase variables would read and
// write real data. next.config.ts checks the same for builds that skip this script.
import { rmSync } from "node:fs";

if (process.env.NEXT_PUBLIC_CONTENT !== "demo") {
  console.error("build:demo 需要 NEXT_PUBLIC_CONTENT=demo");
  process.exit(1);
}
if (process.env.NEXT_PUBLIC_USE_MOCK !== "1") {
  console.error("build:demo 需要 NEXT_PUBLIC_USE_MOCK=1，否則展示站會連到真實的後端");
  process.exit(1);
}
if (process.env.VERCEL !== "1") {
  console.log("不在 Vercel 上，略過刪除 public/photos（本機的照片保留）");
} else {
  rmSync(new URL("../../public/photos", import.meta.url), { recursive: true, force: true });
  console.log("已刪除 public/photos");
}
