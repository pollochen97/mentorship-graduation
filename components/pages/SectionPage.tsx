import { Placeholder } from "@/components/book/Placeholder";
import type { PageProps } from "@/components/book/types";
import { PhotoGrid, Stamp, Tag } from "@/components/ui";
import { isSectionKey, SECTIONS } from "@/content/sections";
import styles from "./section/SectionPage.module.css";
import { Stats } from "./section/Stats";
import { Steps } from "./section/Steps";

// Varies the stamp's angle from chapter to chapter, but the same chapter always looks the same.
const TILTS = [-5, 3, -3, 5, -4, 2];

/** One template for audition, welcome, monthly meetings 1–4 and meetups: text left, photos right. */
export function SectionPage({ chapter, label, no, pageIndex, pageCount }: PageProps) {
  if (!isSectionKey(chapter)) {
    return (
      <Placeholder no={no} label={label} issue={7} pageIndex={pageIndex} pageCount={pageCount} />
    );
  }
  const s = SECTIONS[chapter];
  return (
    <div className={styles.page}>
      <div className={styles.side}>
        <Tag no={no} tone={s.accent} className={styles.tag}>
          {s.tag}
        </Tag>
        <h2 className={styles.title}>{s.title}</h2>
        <Stamp tilt={TILTS[no % TILTS.length]}>{s.date}</Stamp>
        {s.text && <p className={styles.text}>{s.text}</p>}
        {s.outline && (
          <ul className={styles.outline}>
            {s.outline.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
        {s.stats && <Stats items={s.stats} />}
      </div>
      <div className={styles.main}>
        {s.steps && <Steps steps={s.steps} />}
        <div className={styles.photos}>
          <PhotoGrid layout={s.layout} photos={s.photos} />
        </div>
      </div>
    </div>
  );
}
