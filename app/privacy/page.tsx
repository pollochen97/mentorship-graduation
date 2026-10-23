import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/ui";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "隱私權政策 · ENG曼陀號" };

/**
 * The privacy policy (#56). Google needs its URL to publish the guestbook's sign-in (#55) to
 * everyone; it describes what the site actually keeps, so update it when that changes.
 */
export default function PrivacyPage() {
  return (
    <main className={styles.main}>
      <Panel as="article" tone="paper" className={styles.card}>
        <p className={styles.kicker}>ENG曼陀號結業分享</p>
        <h1 className={styles.title}>隱私權政策</h1>
        <p className={styles.lead}>
          這個網站是 ENG曼陀號結業分享的紀念網站，由
          ENG曼陀號的工作人員維護。以下說明網站會保存哪些資料、用在哪裡。
        </p>

        <h2 className={styles.heading}>Google 登入（只用在留言板）</h2>
        <ul className={styles.list}>
          <li>
            留言板限 ENG 夥伴使用，留言前要用 Google 登入。我們只會取得你 Google 帳號的
            <b> email 和名稱</b>，不會取得其他資料，也不會存取你的 Gmail 或雲端硬碟。
          </li>
          <li>email 只用來確認你在不在 ENG 夥伴名單內，以及讓管理員知道每則留言是哪個帳號寫的。</li>
          <li>名稱只用來預先填入留言的署名，你可以自己修改。</li>
          <li>email 不會公開顯示，不會用來寄信，也不會提供給任何第三方。</li>
        </ul>

        <h2 className={styles.heading}>公開顯示的內容</h2>
        <ul className={styles.list}>
          <li>你送出的留言和彈幕，連同你填寫的署名，會公開顯示在網站和現場投影上。</li>
          <li>管理員可以隱藏不當的留言或彈幕。</li>
        </ul>

        <h2 className={styles.heading}>防洗版用的資料</h2>
        <ul className={styles.list}>
          <li>
            網站會在瀏覽器設定一個匿名 cookie（30 天），並保存 IP
            位址經過加密雜湊後的值，只用來限制發送頻率、防止洗版，無法用來辨認你是誰。
          </li>
          <li>瀏覽器會記住你的登入狀態、上次填的彈幕署名等設定，只存在你自己的裝置上。</li>
        </ul>

        <h2 className={styles.heading}>資料存放與刪除</h2>
        <ul className={styles.list}>
          <li>資料存放在 Supabase（資料庫）和 Vercel（網站主機）。</li>
          <li>活動結束、留言板封存後，會刪除 Google 登入的帳號資料。</li>
          <li>在那之前，如果想刪除自己的留言或帳號資料，請聯絡 ENG曼陀號的工作人員。</li>
        </ul>

        <p className={styles.back}>
          <Link href="/">回到網站</Link>
        </p>
      </Panel>
    </main>
  );
}
