import { Stamp } from "@/components/ui";
import { SAILORS } from "@/content/sailors";
import styles from "./cover/Cover.module.css";
import { Voyage } from "./cover/Voyage";

/**
 * The cover (spec 2, chapter 01): the site's title and the date on the left, readable from the back
 * of the room, and the main visual on the right. Wording from flipbook-demo.html.
 */
export function Cover() {
  return (
    <div className={styles.page}>
      <div className={styles.side}>
        <span className={styles.kicker}>LOGBOOK · VOYAGE 2026</span>
        <h1 className={styles.title}>
          ENG曼陀號
          <br />
          結業分享
        </h1>
        <p className={styles.subtitle}>我們的四個月航程</p>
        <Stamp label="Final day" tilt={-5} className={styles.date}>
          11/07 Sat.
        </Stamp>
        <span className={styles.voyageLog}>JUN — OCT · {SAILORS.length} 位學員</span>
      </div>
      <div className={styles.visual}>
        <Voyage />
      </div>
    </div>
  );
}
