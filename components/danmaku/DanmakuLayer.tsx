"use client";

import { useBook } from "@/components/book/BookContext";

// Empty shell from #3; #18 replaces this file.
// Rendered once by BookShell above the whole screen, so turning pages never cuts danmaku off.
// Show nothing while useBook().danmakuOn is false (the D key and the toolbar toggle it).
export function DanmakuLayer() {
  const { danmakuOn } = useBook();
  if (!danmakuOn) return null;
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 150,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    />
  );
}
