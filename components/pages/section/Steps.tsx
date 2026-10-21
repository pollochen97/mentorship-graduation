import styles from "./Steps.module.css";

/** A numbered process, left to right, e.g. the audition flow. */
export function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className={styles.steps}>
      {steps.map((step, i) => (
        <li key={step} className={styles.step}>
          <span className={styles.no}>{String(i + 1).padStart(2, "0")}</span>
          {step}
        </li>
      ))}
    </ol>
  );
}
