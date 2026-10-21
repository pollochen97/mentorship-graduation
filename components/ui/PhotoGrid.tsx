import Image, { type StaticImageData } from "next/image";
import styles from "./PhotoGrid.module.css";
import { cx } from "./tones";

export type Photo = { src: string | StaticImageData; alt: string };
export type PhotoLayout = "hero" | "grid2" | "grid3" | "mosaic";

/** How many photos each layout shows. Extra photos are ignored; missing ones show a placeholder. */
export const PHOTO_SLOTS: Record<PhotoLayout, number> = { hero: 1, grid2: 2, grid3: 6, mosaic: 3 };

// Roughly how wide each slot renders on a full-screen book, so next/image serves a fitting size.
const SIZES: Record<PhotoLayout, string[]> = {
  hero: ["60vw"],
  grid2: ["30vw"],
  grid3: ["20vw"],
  mosaic: ["36vw", "26vw", "26vw"],
};

type PhotoGridProps = {
  layout: PhotoLayout;
  photos: Photo[];
  className?: string;
};

/** Photos in white frames with hard shadows. Fills its parent, so give the parent a size. */
export function PhotoGrid({ layout, photos, className }: PhotoGridProps) {
  const slots = Array.from({ length: PHOTO_SLOTS[layout] }, (_, i) => photos[i]);
  return (
    <div className={cx(styles.grid, styles[layout], className)}>
      {slots.map((photo, i) => (
        <figure key={i} className={styles.frame}>
          <div className={styles.photo}>
            {photo ? (
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes={SIZES[layout][i] ?? SIZES[layout][0]}
                className={styles.img}
              />
            ) : (
              <span className={styles.empty}>PHOTO {i + 1}</span>
            )}
          </div>
        </figure>
      ))}
    </div>
  );
}
