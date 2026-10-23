"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import type { Photo } from "@/components/ui";
import { photoRows } from "./rowLayout";
import styles from "./PhotoRows.module.css";

/** For a photo given as a URL, whose size the build doesn't know. */
const FALLBACK_RATIO = 4 / 3;

const ratioOf = ({ src }: Photo) =>
  typeof src === "string" ? FALLBACK_RATIO : src.width / src.height;

type Box = { width: number; height: number; gap: number };

/**
 * The chapter's photos in rows, each at its own shape, so none is cropped (#7). Fills its parent;
 * the white frames are drawn with box-shadow, so only the photos themselves take up room.
 */
export function PhotoRows({ photos }: { photos: Photo[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);

  // The rows depend on the box size, so measure it (before paint) and again on every resize.
  useLayoutEffect(() => {
    const el = ref.current!;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox({ width, height, gap: parseFloat(getComputedStyle(el).rowGap) || 0 });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const ratios = photos.map(ratioOf);
  const rows = box ? photoRows(ratios, box.width, box.height, box.gap) : [];

  return (
    <div ref={ref} className={styles.rows}>
      {rows.map((row) => (
        <div key={row.items[0]} className={styles.row}>
          {row.items.map((i) => {
            const width = ratios[i] * row.height;
            return (
              <figure key={i} className={styles.photo} style={{ width, height: row.height }}>
                <Image
                  src={photos[i].src}
                  alt={photos[i].alt}
                  fill
                  sizes={`${Math.ceil(width)}px`}
                  className={styles.img}
                />
              </figure>
            );
          })}
        </div>
      ))}
    </div>
  );
}
