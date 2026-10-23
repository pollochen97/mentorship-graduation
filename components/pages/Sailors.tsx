"use client";

import { useState } from "react";
import type { PageProps } from "@/components/book/types";
import { Modal, Tag, type Tone } from "@/components/ui";
import { SAILORS } from "@/content/sailors";
import type { Sailor } from "@/content/types";
import { Avatar } from "./sailors/Avatar";
import styles from "./sailors/Sailors.module.css";

/** Sailors per page: two pages of 6 × 2 (spec 2, chapter 03). */
const PER_PAGE = 12;

const RANK_TONE: Record<Sailor["rank"], Tone> = { 航海士: "yellow", 水手: "mint" };

/** "s07" → "No.07": the number on the card. */
const numberOf = (sailor: Sailor) => `No.${sailor.id.replace(/\D/g, "")}`;

/**
 * 學員介紹: each sailor as a 水手證 (crew card), 航海士 first, 12 to a page. Clicking a card opens their
 * 水手檔案 with the motto and LinkedIn; fields left empty in content/sailors.ts are not shown.
 */
export function Sailors({ no, label, pageIndex, pageCount }: PageProps) {
  const [open, setOpen] = useState(false);
  // Kept after closing so the dialog doesn't flash empty before it closes.
  const [shown, setShown] = useState<Sailor | null>(null);
  const onPage = SAILORS.slice(pageIndex * PER_PAGE, (pageIndex + 1) * PER_PAGE);

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <Tag no={no} tone="blue">
          SAILORS
        </Tag>
        <h2 className={styles.title}>{label}</h2>
        <p className={styles.hint}>
          {SAILORS.length} 位學員 · 點卡片看水手檔案
          {pageCount > 1 && ` · ${pageIndex + 1} / ${pageCount}`}
        </p>
      </header>
      <ul className={styles.grid}>
        {onPage.map((sailor) => (
          <li key={sailor.id} className={styles.cell}>
            <button
              type="button"
              className={styles.card}
              aria-haspopup="dialog"
              onClick={() => {
                setShown(sailor);
                setOpen(true);
              }}
            >
              <span className={styles.strip} aria-hidden>
                <span className={styles.stripLabel}>CREW ID</span>
                <span>{numberOf(sailor)}</span>
              </span>
              <Avatar sailor={sailor} sizes="14vw" className={styles.cardAvatar} />
              <span className={styles.rank} data-tone={RANK_TONE[sailor.rank]}>
                {sailor.rank}
              </span>
              <span className={styles.name}>{sailor.name}</span>
            </button>
          </li>
        ))}
      </ul>
      <Modal open={open} onClose={() => setOpen(false)} title={shown?.name}>
        {shown && <SailorFile sailor={shown} />}
      </Modal>
    </div>
  );
}

/** The 水手檔案 inside the modal. */
function SailorFile({ sailor }: { sailor: Sailor }) {
  return (
    <div className={styles.file}>
      <Avatar sailor={sailor} sizes="40vw" className={styles.fileAvatar} />
      <div className={styles.fileInfo}>
        <p className={styles.fileKicker}>SAILOR FILE · {numberOf(sailor)}</p>
        <span className={styles.rank} data-tone={RANK_TONE[sailor.rank]}>
          {sailor.rank}
        </span>
        {(sailor.motto || sailor.linkedin) && (
          <dl className={styles.fields}>
            {sailor.motto && (
              <div>
                <dt>座右銘</dt>
                <dd className={styles.motto}>{sailor.motto}</dd>
              </div>
            )}
            {sailor.linkedin && (
              <div>
                <dt>LinkedIn</dt>
                <dd>
                  <a
                    href={sailor.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    {sailor.linkedin.replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "")} ↗
                  </a>
                </dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </div>
  );
}
