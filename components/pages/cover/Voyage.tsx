import { cx } from "@/components/ui";
import styles from "./Cover.module.css";

/**
 * A band of sea: a row of crests `length` apart along `top`, filled down to the bottom. It reaches
 * one wavelength past each side, so it can drift by one wavelength and loop without a seam.
 */
function wave(top: number, height: number, length: number) {
  const from = -length;
  const crests = Math.ceil((100 + 2 * length) / length);
  let d = `M${from} ${top}`;
  for (let i = 0; i < crests; i++)
    d += ` q${length / 4} ${-height} ${length / 2} 0 t${length / 2} 0`;
  return `${d} V100 H${from} Z`;
}

/**
 * The cover's main visual, drawn in code until there is artwork (#8): the ship sailing on a pink
 * sky over two bands of sea, in the book's ink lines and accent colours. Decorative.
 * Scales like `object-fit: cover`; the ship stays in the middle.
 */
export function Voyage() {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className={styles.voyage}
      aria-hidden
    >
      <rect width="100" height="100" className={styles.sky} />
      <circle cx="74" cy="24" r="10" className={styles.sun} />
      <path d="M12 26h18a5 5 0 0 0-9-4 4 4 0 0 0-9 4z" className={styles.cloud} />
      <path d="M80 44h12a3.5 3.5 0 0 0-6-3 3 3 0 0 0-6 3z" className={styles.cloud} />
      <path d="M30 36q2.5-2.5 5 0 2.5-2.5 5 0M40 30q2-2 4 0 2-2 4 0" className={styles.line} />

      <path d={wave(64, 2.5, 20)} className={cx(styles.far, styles.drift)} />

      <g className={styles.ship}>
        <path d="M50 66V20" className={styles.line} />
        <path d="M50 20v-6l9 3z" className={styles.flag} />
        <path d="M52 24v38h18z" className={styles.sail} />
        <path d="M48 30v32H34z" className={styles.jib} />
        <path d="M27 64h46l-6 13H33z" className={styles.hull} />
        <path d="M30 69h40" className={styles.line} />
        <text x="50" y="75.2" className={styles.name}>
          ENG
        </text>
      </g>

      <path d={wave(79, 3, 16)} className={cx(styles.near, styles.driftBack)} />
      <path d="M8 88q3-2 6 0M58 92q3-2 6 0M82 84q3-2 6 0" className={styles.foam} />
    </svg>
  );
}
