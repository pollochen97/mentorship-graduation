"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState, useSyncExternalStore } from "react";
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

/**
 * Floats in the bottom-right corner on the projector so guests can scan their way to /danmaku.
 * Collapses to a small tab when it covers something on the page.
 */
export function DanmakuQr() {
  const [open, setOpen] = useState(true);
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
        掃碼發彈幕
      </button>
    );
  }

  return (
    <aside className={styles.card} aria-label="彈幕 QR code">
      <button
        type="button"
        className={styles.close}
        aria-expanded={true}
        aria-label="收合 QR code"
        onClick={() => setOpen(false)}
      >
        −
      </button>
      <p className={styles.title}>掃碼發彈幕</p>
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
