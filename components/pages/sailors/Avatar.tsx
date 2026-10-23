import Image from "next/image";
import type { ReactNode } from "react";
import { cx } from "@/components/ui";
import type { Sailor } from "@/content/types";
import { avatarOf, type AvatarIcon } from "./avatars";
import styles from "./Sailors.module.css";

// Drawn on a 64 × 64 grid in ink with white fills, like the rest of the book's line work.
const ICONS: Record<AvatarIcon, ReactNode> = {
  boat: (
    <>
      <path d="M32 10v32M34 14l16 24H34zM30 20 16 38h14z" fill="white" />
      <path d="M10 42h44l-7 10H17z" fill="white" />
      <path d="M6 57q4-3 8 0t8 0 8 0 8 0 8 0 8 0 8 0" fill="none" />
    </>
  ),
  anchor: (
    <>
      <circle cx="32" cy="12" r="5" fill="white" />
      <path d="M32 17v37M21 25h22" />
      <path d="M13 38q2 16 19 16t19-16" fill="none" />
      <path d="m9 43 4-6 6 4M55 43l-4-6-6 4" fill="none" />
    </>
  ),
  gull: (
    <>
      <circle cx="48" cy="16" r="7" fill="white" />
      <path d="M8 34q11-12 24 2 13-14 24-2" fill="none" />
      <path d="M22 46q5-5 10 1 5-6 10-1" fill="none" />
      <path d="M6 57q4-3 8 0t8 0 8 0 8 0 8 0 8 0 8 0" fill="none" />
    </>
  ),
  lighthouse: (
    <>
      <path d="M24 14 32 6l8 8z" fill="currentColor" />
      <path d="M26 14h12v8H26z" fill="white" />
      <path d="m27 22-4 32h18l-4-32z" fill="white" />
      <path d="M26 33h12M24.5 44h15" />
      <path d="M44 16l12-4M44 20h12M20 16 8 12M20 20H8" />
    </>
  ),
  wheel: (
    <>
      <path d="M32 6v52M6 32h52M13.6 13.6l36.8 36.8M50.4 13.6 13.6 50.4" />
      <circle cx="32" cy="32" r="16" fill="none" strokeWidth="5" />
      <circle cx="32" cy="32" r="5" fill="currentColor" />
    </>
  ),
  compass: (
    <>
      <circle cx="32" cy="34" r="22" fill="white" />
      <path d="m32 16 6 18H26z" fill="currentColor" />
      <path d="m32 52 6-18H26z" fill="white" />
      <path d="M28 4h8M32 4v8" />
    </>
  ),
};

/** The sailor's photo, or an illustrated sea motif fixed by their id. Decorative: the name is next to it. */
export function Avatar({
  sailor,
  sizes,
  className,
}: {
  sailor: Sailor;
  sizes: string;
  className?: string;
}) {
  if (sailor.photo) {
    return (
      <span className={cx(styles.avatar, className)}>
        <Image src={sailor.photo} alt="" fill sizes={sizes} className={styles.photo} />
      </span>
    );
  }
  const { icon, tone } = avatarOf(sailor.id);
  return (
    <span className={cx(styles.avatar, className)} data-tone={tone}>
      <svg
        viewBox="0 0 64 64"
        className={styles.icon}
        aria-hidden
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {ICONS[icon]}
      </svg>
    </span>
  );
}
