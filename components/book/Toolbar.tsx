"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/components/ui";
import styles from "./Toolbar.module.css";

const IDLE_MS = 2500;
const TIP_MS = 8000;

type ToolbarProps = {
  chapters: { key: string; label: string }[];
  currentChapter: string;
  page: number;
  total: number;
  onJump: (key: string) => void;
  danmakuOn: boolean;
  onToggleDanmaku: () => void;
  onFullscreen: () => void;
};

/** Floats over the top-left of the book and fades out when the mouse and keyboard go quiet. */
export function Toolbar({
  chapters,
  currentChapter,
  page,
  total,
  onJump,
  danmakuOn,
  onToggleDanmaku,
  onFullscreen,
}: ToolbarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [idle, setIdle] = useState(false);
  const [showTip, setShowTip] = useState(true);

  useEffect(() => {
    let timer: number | undefined;
    const wake = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        // Stay visible while something in the toolbar has focus, e.g. the chapter menu.
        if (!ref.current?.contains(document.activeElement)) setIdle(true);
      }, IDLE_MS);
    };
    const events = ["pointermove", "pointerdown", "keydown"] as const;
    events.forEach((ev) => addEventListener(ev, wake, { passive: true }));
    wake();
    const tip = window.setTimeout(() => setShowTip(false), TIP_MS);
    return () => {
      events.forEach((ev) => removeEventListener(ev, wake));
      window.clearTimeout(timer);
      window.clearTimeout(tip);
    };
  }, []);

  return (
    <div ref={ref} className={cx(styles.toolbar, idle && styles.idle)}>
      <select
        aria-label="跳到章節"
        value={currentChapter}
        onChange={(e) => {
          onJump(e.target.value);
          e.target.blur(); // hand the arrow keys back to the book
        }}
      >
        {chapters.map((c) => (
          <option key={c.key} value={c.key}>
            {c.label}
          </option>
        ))}
      </select>
      <span className={styles.counter} aria-live="polite">
        {page} / {total}
      </span>
      <button type="button" aria-pressed={danmakuOn} onClick={onToggleDanmaku}>
        彈幕：{danmakuOn ? "開" : "關"}
      </button>
      <button type="button" onClick={onFullscreen}>
        全螢幕
      </button>
      {showTip && <span className={styles.tip}>滾輪、↑↓ 或簡報筆翻頁 · D 開關彈幕 · F 全螢幕</span>}
    </div>
  );
}
