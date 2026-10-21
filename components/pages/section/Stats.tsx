import { ACCENTS, Panel } from "@/components/ui";
import styles from "./Stats.module.css";

/** Big numbers in coloured boxes along the bottom of the text column, e.g. 112 報名人數. */
export function Stats({ items }: { items: { value: string; label: string }[] }) {
  return (
    <dl className={styles.stats}>
      {items.map((item, i) => (
        <Panel
          key={item.label}
          tone={ACCENTS[i % ACCENTS.length]}
          shadow="sm"
          className={styles.stat}
        >
          {/* Label first for screen readers; column-reverse shows the number on top. */}
          <dt>{item.label}</dt>
          <dd className={styles.value}>{item.value}</dd>
        </Panel>
      ))}
    </dl>
  );
}
