import type { ReactNode } from "react";
import styles from "./Tag.module.css";
import { cx, type Tone } from "./tones";

type TagProps = {
  /** Chapter number; renders the logbook format `LOG 06 · 卓越工程師`. Omit for a plain label. */
  no?: number | string;
  tone?: Tone;
  className?: string;
  children: ReactNode;
};

/** Chapter label, written like a ship's log entry. Also works as a plain kicker label. */
export function Tag({ no, tone = "yellow", className, children }: TagProps) {
  return (
    <span data-tone={tone} className={cx(styles.tag, className)}>
      {no !== undefined && <>LOG {String(no).padStart(2, "0")} · </>}
      {children}
    </span>
  );
}
