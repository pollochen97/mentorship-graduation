import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/ui";
import { DanmakuForm } from "./DanmakuForm";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "發彈幕 · ENG曼陀號" };

export default function DanmakuPage() {
  return (
    <main className={styles.main}>
      <Panel as="section" tone="paper" className={styles.card}>
        <p className={styles.kicker}>ENG曼陀號結業分享</p>
        <h1 className={styles.title}>發一則彈幕</h1>
        <p className={styles.lead}>送出後會飄過現場的投影畫面。</p>
        <DanmakuForm />
        <ul className={styles.rules}>
          <li>請友善發言，不要輸入髒話、攻擊或廣告</li>
          <li>每 5 秒可以發一則</li>
          <li>不當內容會被下架</li>
          <li>
            資料怎麼使用，請見<Link href="/privacy">隱私權政策</Link>
          </li>
        </ul>
      </Panel>
    </main>
  );
}
