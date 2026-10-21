import type { HTMLAttributes } from "react";
import styles from "./Panel.module.css";
import { cx, type Tone } from "./tones";

type PanelProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article" | "aside" | "figure";
  tone?: Tone;
  shadow?: "none" | "sm" | "md" | "lg";
};

/** The basic neo-brutalist box: thick ink border plus a hard shadow. */
export function Panel({
  as: Tag = "div",
  tone = "white",
  shadow = "md",
  className,
  ...rest
}: PanelProps) {
  return (
    <Tag
      data-tone={tone}
      className={cx(styles.panel, shadow !== "none" && styles[shadow], className)}
      {...rest}
    />
  );
}
