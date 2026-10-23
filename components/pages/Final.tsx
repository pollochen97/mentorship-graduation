"use client";

import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import type { PageProps } from "@/components/book/types";
import { Modal, Tag } from "@/components/ui";
import { PROJECTS } from "@/content/projects";
import type { Project } from "@/content/types";
import styles from "./final/Final.module.css";

/** The six final projects. Clicking a card shows its QR code full size, for scanning from the back. */
export function Final({ no, label }: PageProps) {
  const [open, setOpen] = useState(false);
  // Kept after closing so the dialog doesn't flash empty before it closes.
  const [shown, setShown] = useState<Project | null>(null);

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <Tag no={no} tone="pink">
          FINAL PROJECTS
        </Tag>
        <h2 className={styles.title}>{label}</h2>
        <p className={styles.hint}>{PROJECTS.length} 組專案，用手機掃 QR code 看作品</p>
      </header>
      <div className={styles.grid}>
        {PROJECTS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={styles.card}
            aria-haspopup="dialog"
            onClick={() => {
              setShown(p);
              setOpen(true);
            }}
          >
            <span className={styles.photo}>
              {p.image ? (
                <Image src={p.image} alt="" fill sizes="14vw" className={styles.img} />
              ) : (
                <span className={styles.empty} aria-hidden>
                  PHOTO
                </span>
              )}
            </span>
            <span className={styles.caption}>
              {p.team && <span className={styles.team}>{p.team}</span>}
              <span className={styles.name}>{p.name}</span>
            </span>
            <QRCodeSVG value={p.url} level="M" marginSize={2} className={styles.qr} />
          </button>
        ))}
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={shown && (shown.team ? `${shown.team} · ${shown.name}` : shown.name)}
      >
        {shown && (
          <div className={styles.big}>
            <QRCodeSVG value={shown.url} level="M" marginSize={2} className={styles.bigQr} />
            <a href={shown.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
              {shown.url.replace(/^https?:\/\//, "")}
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
}
