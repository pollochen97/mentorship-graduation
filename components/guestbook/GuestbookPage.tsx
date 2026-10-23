"use client";

import { useRef } from "react";
import type { GuestbookPageProps } from "@/components/book/types";
import { Tag } from "@/components/ui";
import { isSectionKey, SECTIONS } from "@/content/sections";
import { useGuestbook } from "./GuestbookNotes";
import styles from "./GuestbookPage.module.css";
import { NoteCard } from "./NoteCard";
import { NotePad } from "./NotePad";
import { NOTES_PER_PAGE } from "./paging";

/**
 * One page of a chapter's guestbook (spec 3.1): nine sticky notes in a 5 × 2 grid, oldest first, and
 * the pad in the bottom-right corner of the last page. Earlier pages point on to the next one instead.
 */
export function GuestbookPage({ section, label, no, pageIndex }: GuestbookPageProps) {
  const { notes, post, loading, error, pages, shouldFly } = useGuestbook(section);
  const corner = useRef<HTMLDivElement>(null);
  const start = pageIndex * NOTES_PER_PAGE;
  const onPage = notes.slice(start, start + NOTES_PER_PAGE);
  const last = pageIndex >= pages - 1;
  const title = `${label} 留言板`;

  let count = `${notes.length} 則`;
  if (pages > 1) count += ` · ${pageIndex + 1} / ${pages}`;
  if (loading) count = "載入中…";
  if (error) count = "留言載入失敗，請重新整理";

  return (
    <div className={styles.board}>
      <header className={styles.head}>
        <Tag no={no} tone={isSectionKey(section) ? SECTIONS[section].accent : "yellow"}>
          GUESTBOOK
        </Tag>
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.count} role="status">
          {count}
        </span>
      </header>
      <div className={styles.grid}>
        {onPage.map((note) => (
          <NoteCard key={note.id} note={note} shouldFly={shouldFly} from={corner} />
        ))}
        {Array.from({ length: NOTES_PER_PAGE - onPage.length }, (_, i) => (
          <div key={i} className={styles.empty}>
            {i === 0 && !loading && !error && notes.length === 0 && (
              <p className={styles.hint}>還沒有留言，來貼第一張吧 ↘</p>
            )}
          </div>
        ))}
        <div ref={corner} className={styles.corner}>
          {last ? (
            <NotePad post={post} title={title} />
          ) : (
            <p className={styles.more}>下一頁繼續 ↓</p>
          )}
        </div>
      </div>
    </div>
  );
}
