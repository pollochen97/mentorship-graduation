"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useBook, usePageActive } from "@/components/book/BookContext";
import type { PageProps } from "@/components/book/types";
import { Stamp, Tag } from "@/components/ui";
import { useSettings } from "@/lib/hooks";
import styles from "./group-photo/GroupPhoto.module.css";

/** Like a photo developing in a tray: washed out and blurry, then the colour comes in. */
const DEVELOP: Keyframe[] = [
  { filter: "brightness(2.6) saturate(0) blur(6px)", opacity: 0.2 },
  { opacity: 1, offset: 0.4 },
  { filter: "brightness(1) saturate(1) blur(0)", opacity: 1 },
];
const DEVELOP_MS = 3200;

/**
 * The group photo the admin uploads on the day (#20). Everyone loads it once; only the projector
 * follows photo:final (spec 3.5), swaps the new photo in and develops it, and settings:update, which
 * can also take the photo away again (#64).
 */
export function GroupPhoto({ no, label }: PageProps) {
  const { isProjector } = useBook();
  const active = usePageActive();
  const { finalPhotoUrl, loading } = useSettings({ live: isProjector });
  // The photo on screen: the latest URL once it has downloaded, so it never shows half-loaded.
  const [shown, setShown] = useState<string | null>(null);
  // The URL that failed to download. Only the latest URL's failure counts: a newer one gets a new try.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const failed = !!finalPhotoUrl && failedUrl === finalPhotoUrl;
  // When the admin clears the photo (#64), take the old one down too: otherwise it would stay up, and
  // show again while the next photo downloads.
  const [lastUrl, setLastUrl] = useState(finalPhotoUrl);
  if (lastUrl !== finalPhotoUrl) {
    setLastUrl(finalPhotoUrl);
    if (!finalPhotoUrl) setShown(null);
  }
  // The photo there was when the page loaded: shown as is. Only photos that arrive later develop.
  const initial = useRef<string | null | undefined>(undefined);
  const developed = useRef<string | null>(null);
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (loading) return;
    if (initial.current === undefined) initial.current = finalPhotoUrl;
    if (!finalPhotoUrl) return;
    let cancelled = false;
    const preload = new Image();
    preload.onload = () => !cancelled && setShown(finalPhotoUrl);
    preload.onerror = () => !cancelled && setFailedUrl(finalPhotoUrl);
    preload.src = finalPhotoUrl;
    return () => {
      cancelled = true;
    };
  }, [finalPhotoUrl, loading]);

  // Before paint, so a new photo never flashes in finished. Waits until this page is the one showing:
  // a photo that arrives while the book is on another page develops when it's turned to.
  useLayoutEffect(() => {
    const el = img.current;
    if (!el || !shown || !active || shown === initial.current || developed.current === shown)
      return;
    developed.current = shown;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate(DEVELOP, { duration: DEVELOP_MS, easing: "ease-out" });
  }, [shown, active]);

  let status: string | null = null;
  if (!shown) {
    if (failed) status = "照片載入失敗，請重新整理";
    else if (loading || finalPhotoUrl) status = "照片載入中…";
    else status = "等待合照上傳中…";
  }

  return (
    <div className={styles.page}>
      <div className={styles.side}>
        <Tag no={no} tone="pink">
          FINALE
        </Tag>
        <h2 className={styles.title}>最後的{label}</h2>
        <Stamp label="Port of call" tilt={-4}>
          2026.11.07
        </Stamp>
        <p className={styles.text}>
          結業發表的最後，全體水手和工作人員站在一起。這張照片在現場拍下，直接出現在這一頁。
        </p>
      </div>
      <figure className={styles.frame}>
        <div className={styles.photo}>
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element -- a Supabase Storage URL set on the day
            <img key={shown} ref={img} src={shown} alt="ENG曼陀號全體水手與工作人員的大合照" />
          ) : (
            <p className={styles.empty} role="status">
              {status}
            </p>
          )}
          {/* A newer photo failed: keep the old one up, but say so, so nobody takes it for the new one. */}
          {shown && failed && (
            <p className={styles.error} role="alert">
              新照片載入失敗，目前顯示的是上一張
            </p>
          )}
        </div>
        <figcaption className={styles.caption}>ENG曼陀號 · ALL HANDS</figcaption>
      </figure>
    </div>
  );
}
