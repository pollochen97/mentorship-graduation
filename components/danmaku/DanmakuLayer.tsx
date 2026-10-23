"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useBook } from "@/components/book/BookContext";
import { useDanmakuStream, useSettings } from "@/lib/hooks";
import type { Danmaku } from "@/lib/schemas";
import styles from "./DanmakuLayer.module.css";

/** Rows a danmaku can fly in; their positions are set in DanmakuLayer.module.css. */
const LANES = 8;
const MAX_ON_SCREEN = 15;
const MAX_QUEUED = 50;
/** Seconds to cross the screen. Every danmaku moves at the same speed, so none catches up with another. */
const CROSS_S = 10;
/** Space before the next danmaku may enter the same lane, as a share of the screen width. */
const LANE_GAP = 0.04;
const LAUNCH_EVERY_MS = 200;

type Flying = { danmaku: Danmaku; lane: number };

/**
 * Danmaku flying right to left over the whole screen, so turning pages never cuts them off.
 * Only BookShell renders it, and only on the projector (spec 3.5). Hidden by the D key or the toolbar
 * (this screen only) and while the admin has danmaku paused (settings:update).
 */
export function DanmakuLayer() {
  const { danmakuOn } = useBook();
  const { danmakuEnabled } = useSettings({ live: true });
  // Unmounting the stream while hidden drops what was queued; showing again starts from new danmaku.
  return danmakuOn && danmakuEnabled ? <Stream /> : null;
}

function Stream() {
  const [flying, setFlying] = useState<Flying[]>([]);
  const queue = useRef<Danmaku[]>([]);
  const onScreen = useRef(new Map<number, number>()); // id → lane
  // When each lane is free for the next danmaku (performance.now() time).
  const laneFree = useRef<number[]>(Array(LANES).fill(0));

  const launch = useCallback(() => {
    const now = performance.now();
    const next: Flying[] = [];
    while (queue.current.length > 0 && onScreen.current.size < MAX_ON_SCREEN) {
      const lane = laneFree.current.findIndex((t) => t <= now);
      if (lane < 0) break;
      // Taken until the danmaku has measured itself and knows when its tail clears the edge.
      laneFree.current[lane] = Infinity;
      const danmaku = queue.current.shift()!;
      onScreen.current.set(danmaku.id, lane);
      next.push({ danmaku, lane });
    }
    if (next.length > 0) setFlying((prev) => [...prev, ...next]);
  }, []);

  useDanmakuStream(
    (danmaku) => {
      queue.current.push(danmaku);
      if (queue.current.length > MAX_QUEUED) queue.current.shift();
      launch();
    },
    (id) => {
      queue.current = queue.current.filter((d) => d.id !== id);
      const lane = onScreen.current.get(id);
      if (lane === undefined) return;
      onScreen.current.delete(id);
      if (laneFree.current[lane] === Infinity) laneFree.current[lane] = 0;
      setFlying((prev) => prev.filter((f) => f.danmaku.id !== id));
    },
  );

  // Lanes free up as danmaku move along, so keep trying while some are waiting.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (queue.current.length > 0) launch();
    }, LAUNCH_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [launch]);

  const onEnter = useCallback((lane: number, freeInMs: number) => {
    laneFree.current[lane] = performance.now() + freeInMs;
  }, []);

  const onDone = useCallback(
    (id: number) => {
      onScreen.current.delete(id);
      setFlying((prev) => prev.filter((f) => f.danmaku.id !== id));
      launch();
    },
    [launch],
  );

  return (
    <div className={styles.layer} aria-hidden="true">
      {flying.map(({ danmaku, lane }) => (
        <Bullet key={danmaku.id} danmaku={danmaku} lane={lane} onEnter={onEnter} onDone={onDone} />
      ))}
    </div>
  );
}

type BulletProps = Flying & {
  /** Reports how long until the lane has room for the next danmaku. */
  onEnter: (lane: number, freeInMs: number) => void;
  onDone: (id: number) => void;
};

function Bullet({ danmaku, lane, onEnter, onDone }: BulletProps) {
  const ref = useRef<HTMLSpanElement>(null);

  // Measure before the first paint, then fly from just off the right edge until fully off the left.
  useLayoutEffect(() => {
    const el = ref.current!;
    const screen = el.parentElement!.clientWidth;
    const width = el.offsetWidth;
    const speed = screen / CROSS_S / 1000; // px per ms
    onEnter(lane, (width + screen * LANE_GAP) / speed);
    const animation = el.animate(
      [{ transform: "translateX(0)" }, { transform: `translateX(${-(screen + width)}px)` }],
      { duration: (screen + width) / speed, easing: "linear" },
    );
    animation.onfinish = () => onDone(danmaku.id);
    return () => {
      animation.onfinish = null;
      animation.cancel();
    };
  }, [danmaku.id, lane, onEnter, onDone]);

  return (
    <span ref={ref} className={styles.bullet} style={{ "--lane": lane } as CSSProperties}>
      <b>{danmaku.name}</b>：{danmaku.body}
    </span>
  );
}
