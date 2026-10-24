import Image from "next/image";
import type { PageProps } from "@/components/book/types";
import { Tag } from "@/components/ui";
import { PROJECTS } from "@/content/projects";
import styles from "./final/Final.module.css";

export function Final({ no, label }: PageProps) {
  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <Tag no={no} tone="pink">
          FINAL PROJECTS
        </Tag>
        <h2 className={styles.title}>{label}</h2>
      </header>
      <div className={styles.grid}>
        {PROJECTS.map((p) => (
          <div key={p.id} className={styles.card}>
            <span className={styles.caption}>
              {p.team && <span className={styles.team}>{p.team}</span>}
              <span className={styles.name}>{p.name}</span>
            </span>
            <span className={styles.photo}>
              {p.image ? (
                <Image src={p.image} alt="" fill sizes="20vw" className={styles.img} />
              ) : (
                <span className={styles.empty} aria-hidden>
                  PHOTO
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
