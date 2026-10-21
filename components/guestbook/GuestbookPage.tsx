import { Placeholder } from "@/components/book/Placeholder";
import type { GuestbookPageProps } from "@/components/book/types";
import styles from "./GuestbookPage.module.css";

// Empty shell from #3; #14 replaces this file.
// The book shows one guestbook page per chapter until this component reports more with
// useBook().setGuestbookPages(section, pages), e.g. once the notes no longer fit on one page.
export function GuestbookPage({ label, no, pageIndex, pageCount }: GuestbookPageProps) {
  return (
    <div className={styles.board}>
      <Placeholder
        no={no}
        label={`留言板 · ${label}`}
        issue={14}
        pageIndex={pageIndex}
        pageCount={pageCount}
      />
    </div>
  );
}
