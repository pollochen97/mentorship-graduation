import type { ReactNode } from "react";
import styles from "./Stamp.module.css";
import { cx } from "./tones";

type StampProps = {
  /** Small text along the top, e.g. "PORT OF CALL". */
  label?: ReactNode;
  /** rect looks like a customs stamp, round like a port stamp. */
  shape?: "rect" | "round";
  /** Rotation in degrees; a slight tilt makes it look hand-stamped. */
  tilt?: number;
  className?: string;
  children: ReactNode;
};

/** A rubber-stamp mark, used next to dates. */
export function Stamp({ label, shape = "rect", tilt = -6, className, children }: StampProps) {
  return (
    <span
      className={cx(styles.stamp, styles[shape], className)}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      {label && <span className={styles.label}>{label}</span>}
      <span className={styles.main}>{children}</span>
    </span>
  );
}
