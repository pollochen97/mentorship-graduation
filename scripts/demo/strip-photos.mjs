#!/usr/bin/env node
// For the public demo site's build (`npm run build:demo`, NEXT_PUBLIC_CONTENT=demo): deletes
// public/photos before `next build`, so the participants' photos aren't served from the demo even by
// direct URL. The demo's pages don't use them (next.config.ts swaps in content/demo/).
// Only runs on Vercel, so a local `npm run build:demo` can't wipe your working tree.
import { rmSync } from "node:fs";

if (process.env.NEXT_PUBLIC_CONTENT !== "demo") {
  console.error("build:demo 需要 NEXT_PUBLIC_CONTENT=demo");
  process.exit(1);
}
if (process.env.VERCEL !== "1") {
  console.log("不在 Vercel 上，略過刪除 public/photos（本機的照片保留）");
} else {
  rmSync(new URL("../../public/photos", import.meta.url), { recursive: true, force: true });
  console.log("已刪除 public/photos");
}
