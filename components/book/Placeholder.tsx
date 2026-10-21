import { Tag } from "@/components/ui";
import styles from "./Placeholder.module.css";

type PlaceholderProps = {
  no: number;
  label: string;
  /** The issue that will replace this page. */
  issue: number;
  pageIndex?: number;
  pageCount?: number;
};

/** Stand-in content for pages that haven't been built yet. */
export function Placeholder({ no, label, issue, pageIndex = 0, pageCount = 1 }: PlaceholderProps) {
  return (
    <div className={styles.page}>
      <Tag no={no}>{label}</Tag>
      <h2 className={styles.title}>
        {label}
        {pageCount > 1 && (
          <span className={styles.part}>
            {" "}
            {pageIndex + 1} / {pageCount}
          </span>
        )}
      </h2>
      <p className={styles.body}>這一頁由 #{issue} 負責，目前是佔位內容。</p>
    </div>
  );
}
