"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { DanmakuLayer } from "@/components/danmaku/DanmakuLayer";
import { GuestbookPage } from "@/components/guestbook/GuestbookPage";
import { cx } from "@/components/ui";
import { BookContext, PageContext } from "./BookContext";
import styles from "./BookShell.module.css";
import { CHAPTERS } from "./pages";
import { Toolbar } from "./Toolbar";
import type { Chapter, GuestbookSection } from "./types";

/** One physical page of the book. The id doubles as the URL hash, e.g. #m1-guestbook-2. */
type Leaf = {
  id: string;
  chapter: Chapter;
  no: number;
  guestbook?: GuestbookSection;
  pageIndex: number;
  pageCount: number;
};

type GuestbookPages = Partial<Record<GuestbookSection, number>>;

// How long leaves keep their raised z-index after a flip; longer than the slowest staggered flip.
const SETTLE_MS = 1500;
const RINGS = 16;

function buildLeaves(guestbookPages: GuestbookPages): Leaf[] {
  return CHAPTERS.flatMap((chapter, i) => {
    const no = i + 1;
    const count = chapter.pageCount ?? 1;
    const leaves: Leaf[] = Array.from({ length: count }, (_, p) => ({
      id: p ? `${chapter.key}-${p + 1}` : chapter.key,
      chapter,
      no,
      pageIndex: p,
      pageCount: count,
    }));
    const section = chapter.guestbook;
    if (section) {
      const pages = Math.max(1, guestbookPages[section] ?? 1);
      for (let p = 0; p < pages; p++) {
        leaves.push({
          id: `${chapter.key}-guestbook${p ? `-${p + 1}` : ""}`,
          chapter,
          no,
          guestbook: section,
          pageIndex: p,
          pageCount: pages,
        });
      }
    }
    return leaves;
  });
}

/**
 * Index of the page with this id. If that page was removed (fewer guestbook pages), falls back to the
 * last remaining page of the same run, e.g. m1-guestbook-3 → m1-guestbook-2.
 */
function resolveIndex(leaves: Leaf[], id: string) {
  const index = leaves.findIndex((leaf) => leaf.id === id);
  if (index >= 0) return index;
  const base = id.replace(/-\d+$/, "");
  return Math.max(
    0,
    leaves.findLastIndex((leaf) => leaf.id === base || leaf.id.startsWith(`${base}-`)),
  );
}

function hashId() {
  return decodeURIComponent(location.hash.slice(1));
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

/**
 * The projected flip book: a 16:9 page hinged at the top, flipped with the wheel, arrow keys,
 * PageUp/PageDown (presenter clickers), Home/End or a vertical swipe. Ported from docs/flipbook-demo.html.
 */
export function BookShell() {
  const [guestbookPages, setGuestbookPagesState] = useState<GuestbookPages>({});
  const leaves = useMemo(() => buildLeaves(guestbookPages), [guestbookPages]);
  // Track the current page by id, so pages inserted before it (more guestbook pages) don't move it.
  const [curId, setCurId] = useState(leaves[0].id);
  const cur = resolveIndex(leaves, curId);
  // The current page was removed: settle on the page we fell back to, so the URL follows too.
  if (leaves[cur].id !== curId) setCurId(leaves[cur].id);
  // While flipping, the leaves in between are raised above the rest and flip one after another.
  const [flip, setFlip] = useState<{ from: number; to: number; forward: boolean } | null>(null);
  // Skips the flip animation, for jumping straight to the page in the URL on load.
  const [instant, setInstant] = useState(false);
  const [danmakuOn, setDanmakuOn] = useState(true);

  const live = useRef({ cur, leaves });
  const settleTimer = useRef<number | undefined>(undefined);
  const hashReady = useRef(false);
  // A page from the URL that doesn't exist yet, e.g. #m1-guestbook-2 before the notes have loaded.
  const pendingId = useRef<string | null>(null);
  const swipe = useRef<{ y: number; pointerId: number } | null>(null);

  useEffect(() => {
    live.current = { cur, leaves };
  });

  const goTo = useCallback((target: number) => {
    pendingId.current = null; // the reader moved on; stop waiting for the page in the URL
    const { cur, leaves } = live.current;
    const to = Math.max(0, Math.min(leaves.length - 1, target));
    if (to === cur) return;
    setFlip({ from: Math.min(to, cur), to: Math.max(to, cur), forward: to > cur });
    setCurId(leaves[to].id);
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => setFlip(null), SETTLE_MS);
  }, []);

  const step = useCallback((delta: number) => goTo(live.current.cur + delta), [goTo]);

  const goToId = useCallback(
    (id: string) => {
      const index = live.current.leaves.findIndex((leaf) => leaf.id === id);
      if (index >= 0) goTo(index);
    },
    [goTo],
  );

  const goToChapter = useCallback(
    (key: string) => {
      const index = live.current.leaves.findIndex((leaf) => leaf.chapter.key === key);
      if (index >= 0) goTo(index);
    },
    [goTo],
  );

  const setGuestbookPages = useCallback((section: GuestbookSection, pages: number) => {
    setGuestbookPagesState((prev) =>
      prev[section] === pages ? prev : { ...prev, [section]: pages },
    );
  }, []);

  const exists = useCallback(
    (id: string) => live.current.leaves.some((leaf) => leaf.id === id),
    [],
  );

  // Show a page without flipping through everything before it.
  const jumpInstantly = useCallback((id: string) => {
    setInstant(true);
    setCurId(id);
    requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
  }, []);

  // Open the page named in the URL hash. Guestbook pages past the first only exist once the
  // guestbook reports them, so remember those and open them when they appear (next effect).
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const id = hashId();
      if (id && exists(id)) jumpInstantly(id);
      else if (id) pendingId.current = id;
      hashReady.current = true;
    });
    const onHashChange = () => {
      const id = hashId();
      if (exists(id)) goToId(id);
      else if (id) pendingId.current = id;
    };
    addEventListener("hashchange", onHashChange);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("hashchange", onHashChange);
    };
  }, [exists, goToId, jumpInstantly]);

  useEffect(() => {
    const id = pendingId.current;
    if (!id || !leaves.some((leaf) => leaf.id === id)) return;
    requestAnimationFrame(() => {
      if (pendingId.current !== id) return; // the reader flipped away in the meantime
      pendingId.current = null;
      jumpInstantly(id);
    });
  }, [leaves, jumpInstantly]);

  // Keep the URL on the current page, so reloading during development stays put.
  // While a page from the URL is pending, leave the URL alone so it isn't lost.
  useEffect(() => {
    if (!hashReady.current || pendingId.current) return;
    const url = curId === leaves[0].id ? location.pathname : `#${curId}`;
    history.replaceState(null, "", url);
  }, [curId, leaves]);

  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  // Wheel: one flip per gesture. Trackpads send many small events, so add them up and then pause.
  useEffect(() => {
    let total = 0;
    let lockedUntil = 0;
    let idle: number | undefined;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch zoom
      if ((e.target as Element).closest?.("textarea, select, [data-scrollable]")) return;
      e.preventDefault();
      const now = performance.now();
      window.clearTimeout(idle);
      idle = window.setTimeout(() => (total = 0), 220);
      if (now < lockedUntil) return;
      total += e.deltaY;
      if (Math.abs(total) > 40) {
        step(total > 0 ? 1 : -1);
        total = 0;
        lockedUntil = now + 700;
      }
    };
    addEventListener("wheel", onWheel, { passive: false });
    return () => {
      removeEventListener("wheel", onWheel);
      window.clearTimeout(idle);
    };
  }, [step]);

  // Keys. Presenter clickers send PageUp/PageDown (some send arrows).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as Element;
      if (target.closest?.("input, textarea, select, [contenteditable]")) return;
      switch (e.key) {
        case " ":
          if (target.closest?.("button, a, summary")) return; // let Space press the button
          e.preventDefault();
          return step(e.shiftKey ? -1 : 1);
        case "ArrowDown":
        case "ArrowRight":
        case "PageDown":
          e.preventDefault();
          return step(1);
        case "ArrowUp":
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          return step(-1);
        case "Home":
          e.preventDefault();
          return goTo(0);
        case "End":
          e.preventDefault();
          return goTo(Number.MAX_SAFE_INTEGER);
        case "d":
        case "D":
          return setDanmakuOn((on) => !on);
        case "f":
        case "F":
          return toggleFullscreen();
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [step, goTo]);

  const book = useMemo(
    () => ({ danmakuOn, setDanmakuOn, goToChapter, setGuestbookPages }),
    [danmakuOn, goToChapter, setGuestbookPages],
  );

  const chapters = useMemo(
    () =>
      CHAPTERS.map((c, i) => ({
        key: c.key,
        label: `${String(i + 1).padStart(2, "0")} ${c.label}`,
      })),
    [],
  );

  const n = leaves.length;
  return (
    <BookContext value={book}>
      <div className={styles.stage}>
        <Toolbar
          chapters={chapters}
          currentChapter={leaves[cur].chapter.key}
          page={cur + 1}
          total={n}
          onJump={goToChapter}
          danmakuOn={danmakuOn}
          onToggleDanmaku={() => setDanmakuOn(!danmakuOn)}
          onFullscreen={toggleFullscreen}
        />
        <div
          className={cx(styles.book, instant && styles.instant)}
          tabIndex={0}
          aria-label="航海日誌。用滾輪、方向鍵或簡報筆翻頁"
          aria-roledescription="翻頁書"
          onPointerDown={(e) => {
            if (e.pointerType !== "mouse") swipe.current = { y: e.clientY, pointerId: e.pointerId };
          }}
          onPointerUp={(e) => {
            const start = swipe.current;
            swipe.current = null;
            if (!start || start.pointerId !== e.pointerId) return;
            const dy = e.clientY - start.y;
            if (Math.abs(dy) > 40) step(dy < 0 ? 1 : -1); // swipe up = next page
          }}
          onPointerCancel={() => (swipe.current = null)}
        >
          {leaves.map((leaf, k) => {
            const moving = flip !== null && k >= flip.from && k < flip.to;
            let delay = 0;
            if (moving) {
              const order = flip.forward ? k - flip.from : flip.to - 1 - k;
              delay = order * Math.min(90, 600 / (flip.to - flip.from));
            }
            const style: CSSProperties = {
              zIndex: (k < cur ? k + 1 : n - k) + (moving ? 400 : 0),
              transitionDelay: delay ? `${delay}ms` : undefined,
            };
            return (
              <div
                key={leaf.id}
                className={cx(styles.leaf, k < cur && styles.flipped)}
                style={style}
                inert={k !== cur}
              >
                <LeafContent leaf={leaf} active={k === cur} />
              </div>
            );
          })}
          <div className={styles.rings} aria-hidden="true">
            {Array.from({ length: RINGS }, (_, i) => (
              <i key={i} />
            ))}
          </div>
        </div>
        <DanmakuLayer />
      </div>
    </BookContext>
  );
}

// Memoised so flipping only re-renders the two pages whose `active` changed.
const LeafContent = memo(function LeafContent({ leaf, active }: { leaf: Leaf; active: boolean }) {
  const { chapter, guestbook, no, pageIndex, pageCount } = leaf;
  const Page = chapter.component;
  return (
    <section className={styles.face} aria-label={chapter.label}>
      <PageContext value={{ active }}>
        {guestbook ? (
          <GuestbookPage
            section={guestbook}
            label={chapter.label}
            no={no}
            pageIndex={pageIndex}
            pageCount={pageCount}
          />
        ) : (
          <Page
            chapter={chapter.key}
            label={chapter.label}
            no={no}
            pageIndex={pageIndex}
            pageCount={pageCount}
          />
        )}
      </PageContext>
    </section>
  );
});
