"use client";

import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from "react";
import { usePageActive } from "@/components/book/BookContext";
import { ACCENTS } from "@/components/ui";
import type { Note } from "@/lib/schemas";
import styles from "./NoteCard.module.css";

/** A slight tilt between -3.5° and 3.5°, always the same for the same note. */
function tiltOf(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return (Math.abs(h) % 71) / 10 - 3.5;
}

type NoteCardProps = {
  note: Note;
  /** True once if this note should fly in; see useGuestbook(). */
  shouldFly: (id: string) => boolean;
  /** Where it flies from: the pad's corner. */
  from: RefObject<HTMLElement | null>;
};

/** A sticky note on the board. A new one flies from the pad to its slot and lands with a bounce. */
export function NoteCard({ note, shouldFly, from }: NoteCardProps) {
  const ref = useRef<HTMLElement>(null);
  const active = usePageActive();
  const tilt = tiltOf(note.id);

  // Before paint, so the note never shows in its slot first.
  useLayoutEffect(() => {
    if (!shouldFly(note.id)) return;
    const el = ref.current;
    const origin = from.current;
    if (!el || !origin || !active || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const a = origin.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    const dx = a.left + a.width / 2 - (b.left + b.width / 2);
    const dy = a.top + a.height / 2 - (b.top + b.height / 2);
    const rest = `rotate(${tilt}deg)`;
    el.classList.add(styles.flying);
    el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(0.9)`, easing: "ease-out" },
        {
          transform: `translate(${dx * 0.4}px, ${dy * 0.4 - b.height * 0.4}px) rotate(-8deg) scale(1.15)`,
          offset: 0.5,
          easing: "ease-in",
        },
        { transform: `${rest} scale(0.92, 0.88)`, offset: 0.8, easing: "ease-out" },
        { transform: `${rest} scale(1.04)`, offset: 0.9 },
        { transform: rest },
      ],
      { duration: 1000 },
    ).onfinish = () => el.classList.remove(styles.flying);
  }, [note.id, shouldFly, from, active, tilt]);

  return (
    <article
      ref={ref}
      className={styles.note}
      data-tone={ACCENTS[note.color] ?? ACCENTS[0]}
      style={{ "--tilt": `${tilt}deg` } as CSSProperties}
    >
      <p className={styles.body}>{note.body}</p>
      <p className={styles.name}>— {note.name}</p>
    </article>
  );
}
