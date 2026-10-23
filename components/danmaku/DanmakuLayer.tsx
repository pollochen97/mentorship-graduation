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
/** While it's quiet, danmaku take turns among these top lanes; the rest open up as traffic grows. */
const QUIET_LANES = 3;
const MAX_ON_SCREEN = 15;
const MAX_QUEUED = 50;
/** Seconds to cross the screen. Every danmaku moves at the same speed, so none catches up with another. */
const CROSS_S = 10;
/** Space before the next danmaku may enter the same lane, as a share of the screen width. */
const LANE_GAP = 0.04;
const LAUNCH_EVERY_MS = 200;

type Flying = { danmaku: Danmaku; lane: number };

/** The newest danmaku in a lane: its id until it has mounted, then its element. */
type LaneTail = null | number | HTMLElement;

const pickRandom = (list: number[]) => list[Math.floor(Math.random() * list.length)];

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
  const layer = useRef<HTMLDivElement>(null);
  const queue = useRef<Danmaku[]>([]);
  const onScreen = useRef(new Map<number, number>()); // id → lane
  const tails = useRef<LaneTail[]>(Array(LANES).fill(null));
  const lastLane = useRef(-1);

  /**
   * A lane is free once the tail of its newest danmaku has moved a gap clear of the right edge.
   * Measured from where it really is, so a stalled frame can't make two danmaku overlap.
   */
  const pickLane = useCallback(() => {
    const screen = layer.current?.clientWidth ?? 0;
    const free = tails.current.flatMap((tail, lane) => {
      if (typeof tail === "number") return [];
      if (tail && tail.getBoundingClientRect().right > screen * (1 - LANE_GAP)) return [];
      return [lane];
    });
    const others = free.filter((lane) => lane !== lastLane.current);
    const quiet = others.filter((lane) => lane < QUIET_LANES);
    if (quiet.length > 0) return pickRandom(quiet);
    return others[0] ?? free[0] ?? -1;
  }, []);

  const launch = useCallback(() => {
    const next: Flying[] = [];
    while (queue.current.length > 0 && onScreen.current.size < MAX_ON_SCREEN) {
      const lane = pickLane();
      if (lane < 0) break;
      const danmaku = queue.current.shift()!;
      tails.current[lane] = danmaku.id;
      lastLane.current = lane;
      onScreen.current.set(danmaku.id, lane);
      next.push({ danmaku, lane });
    }
    if (next.length > 0) setFlying((prev) => [...prev, ...next]);
  }, [pickLane]);

  const land = useCallback((id: number) => {
    const lane = onScreen.current.get(id);
    // Taken down before it mounted: give its lane back.
    if (lane !== undefined && tails.current[lane] === id) tails.current[lane] = null;
    onScreen.current.delete(id);
    setFlying((prev) => prev.filter((f) => f.danmaku.id !== id));
  }, []);

  useDanmakuStream(
    (danmaku) => {
      queue.current.push(danmaku);
      if (queue.current.length > MAX_QUEUED) queue.current.shift();
      launch();
    },
    (id) => {
      queue.current = queue.current.filter((d) => d.id !== id);
      if (onScreen.current.has(id)) land(id);
    },
  );

  // Lanes free up as danmaku move along, so keep trying while some are waiting.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (queue.current.length > 0) launch();
    }, LAUNCH_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [launch]);

  const onMount = useCallback((lane: number, el: HTMLElement) => {
    tails.current[lane] = el;
    return () => {
      // Only clear the lane if no newer danmaku has entered it since.
      if (tails.current[lane] === el) tails.current[lane] = null;
    };
  }, []);

  const onDone = useCallback(
    (id: number) => {
      land(id);
      launch();
    },
    [land, launch],
  );

  return (
    <div ref={layer} className={styles.layer} aria-hidden="true">
      {flying.map(({ danmaku, lane }) => (
        <Bullet key={danmaku.id} danmaku={danmaku} lane={lane} onMount={onMount} onDone={onDone} />
      ))}
    </div>
  );
}

type BulletProps = Flying & {
  /** Gets the element once it is flying; returns what to call when it is gone. */
  onMount: (lane: number, el: HTMLElement) => () => void;
  onDone: (id: number) => void;
};

function Bullet({ danmaku, lane, onMount, onDone }: BulletProps) {
  const ref = useRef<HTMLSpanElement>(null);

  // Measure before the first paint, then fly from just off the right edge until fully off the left.
  useLayoutEffect(() => {
    const el = ref.current!;
    const screen = el.parentElement!.clientWidth;
    const width = el.offsetWidth;
    const speed = screen / CROSS_S / 1000; // px per ms
    const animation = el.animate(
      [{ transform: "translateX(0)" }, { transform: `translateX(${-(screen + width)}px)` }],
      { duration: (screen + width) / speed, easing: "linear" },
    );
    animation.onfinish = () => onDone(danmaku.id);
    const leave = onMount(lane, el);
    return () => {
      leave();
      animation.onfinish = null;
      animation.cancel();
    };
  }, [danmaku.id, lane, onMount, onDone]);

  return (
    <span ref={ref} className={styles.bullet} style={{ "--lane": lane } as CSSProperties}>
      <b>{danmaku.name}</b>：{danmaku.body}
    </span>
  );
}
