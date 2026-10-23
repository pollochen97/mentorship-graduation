"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState, useSyncExternalStore, type CSSProperties } from "react";
import styles from "./DanmakuQr.module.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
const noSubscribe = () => () => {};

/** NEXT_PUBLIC_SITE_URL, or this page's origin when it isn't set (only known in the browser). */
function useSiteUrl() {
  const origin = useSyncExternalStore(
    noSubscribe,
    () => location.origin,
    () => null,
  );
  return SITE_URL || origin;
}

/** Card sizes, as a share of the full size; the first is the default. */
const SIZES = [
  { label: "小", scale: 0.7 },
  { label: "中", scale: 0.85 },
  { label: "大", scale: 1 },
];
const SIZE_KEY = "danmaku-qr-size";
const sizeListeners = new Set<() => void>();
// Used when localStorage is unavailable (private window, blocked storage), so the button still works.
let sizeInMemory: number | null = null;

function readSize() {
  if (sizeInMemory !== null) return sizeInMemory;
  try {
    const stored = Number(localStorage.getItem(SIZE_KEY));
    return Number.isInteger(stored) && SIZES[stored] ? stored : 0;
  } catch {
    return 0;
  }
}

function writeSize(size: number) {
  sizeInMemory = size;
  try {
    localStorage.setItem(SIZE_KEY, String(size));
  } catch {}
  sizeListeners.forEach((listener) => listener());
}

/**
 * The card's size, remembered on this computer: set it once on the projector at the rehearsal (#22)
 * and it stays after a reload.
 */
function useSize() {
  const size = useSyncExternalStore(
    (listener) => {
      sizeListeners.add(listener);
      return () => sizeListeners.delete(listener);
    },
    readSize,
    () => 0,
  );
  return [size, () => writeSize((size + 1) % SIZES.length)] as const;
}

/**
 * Floats in the bottom-left corner on the projector so guests can scan their way to /danmaku. Always
 * the same corner, so it doesn't jump between pages (pages keep their own controls bottom-right).
 * Collapses to a small tab when it covers something on the page; the size button cycles 小／中／大
 * for when it doesn't scan from the back of the room.
 */
export function DanmakuQr() {
  const [open, setOpen] = useState(true);
  const [size, nextSize] = useSize();
  const site = useSiteUrl();
  if (!site) return null;
  const url = `${site}/danmaku`;

  if (!open) {
    return (
      <button
        type="button"
        className={styles.tab}
        aria-expanded={false}
        onClick={() => setOpen(true)}
      >
        掃描發送彈幕
      </button>
    );
  }

  const { label, scale } = SIZES[size];
  return (
    <aside
      className={styles.card}
      style={{ "--qr-scale": scale } as CSSProperties}
      aria-label="彈幕 QR code"
    >
      <button
        type="button"
        className={styles.size}
        aria-label={`QR code 大小：${label}，點一下切換`}
        title="切換 QR code 大小"
        onClick={nextSize}
      >
        {label}
      </button>
      <button
        type="button"
        className={styles.close}
        aria-expanded={true}
        aria-label="收合 QR code"
        onClick={() => setOpen(false)}
      >
        −
      </button>
      <p className={styles.title}>掃描發送彈幕</p>
      <QRCodeSVG
        value={url}
        size={256}
        level="M"
        marginSize={2}
        title={url}
        className={styles.code}
      />
      <p className={styles.url}>{url.replace(/^https?:\/\//, "")}</p>
    </aside>
  );
}
