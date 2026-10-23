import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/ui";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "隱私權政策 · ENG曼陀號" };

/**
 * The privacy policy (#56). Google needs its URL to publish the guestbook's sign-in (#55) to
 * everyone; it describes what the site actually keeps, so update it when that changes. Linked from
 * the sign-in on the guestbook, /danmaku, /auth/callback and the cover. The deletion date and the
 * 7-day promise are tracked in #61.
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
          <li>留言板限 ENG 夥伴使用，留言前要用 Google 登入。看留言、發彈幕都不需要登入。</li>
          <li>
            登入時，Google 會提供你帳號的 email、名稱、大頭貼網址和 Google 帳號 ID，由登入服務
            Supabase 存下來。Supabase 也會留下登入紀錄（時間、IP 位址、瀏覽器資訊），用於安全稽核。
          </li>
          <li>
            我們實際<b>只使用 email 和名稱</b>
            ：email 用來確認你在不在 ENG
            夥伴名單內，以及讓管理員知道每則留言是哪個帳號寫的；名稱用來預先填入留言的署名，你可以自己修改。大頭貼和
            Google 帳號 ID 不會被使用或顯示。
          </li>
          <li>我們不會存取你的 Gmail、雲端硬碟或其他 Google 服務。</li>
          <li>email 不會公開顯示，也不會用來寄信給你。</li>
          <li>
            我們使用 Google 使用者資料時，遵守{" "}
            <a href="https://developers.google.com/terms/api-services-user-data-policy">
              Google API Services User Data Policy
            </a>
            ，包含其中的 Limited Use 規定。
          </li>
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

        <h2 className={styles.heading}>資料的分享與存放</h2>
        <ul className={styles.list}>
          <li>我們不會出售、出租或分享你的資料給任何人。</li>
          <li>
            資料只交由代我們提供服務的 Supabase（資料庫與登入）和
            Vercel（網站主機）存放與處理，它們只依我們的設定提供服務。
          </li>
          <li>能看到 email 的只有網站管理員。</li>
        </ul>

        <h2 className={styles.heading}>資料刪除</h2>
        <ul className={styles.list}>
          <li>
            我們最晚會在 <b>2026 年 12 月 31 日</b>
            前，刪除所有 Google 登入的帳號資料和 ENG 夥伴名單。
          </li>
          <li>
            在那之前，你可以隨時寄信到{" "}
            <a href="mailto:chichichen97@gmail.com">chichichen97@gmail.com</a>
            ，附上你登入用的 Google email，要求刪除你的帳號資料。我們會在收到後 <b>7 天內</b>
            處理並回信；如果你也希望刪除自己的留言，請在信中說明，留言會一併刪除。
          </li>
          <li>
            除非你要求刪除，已公開的留言內容和署名會保留在網站上，但刪除帳號資料後就不再和你的
            Google 帳號有關聯。
          </li>
          <li>對這份政策有任何問題，也歡迎寄信到上面的信箱。</li>
        </ul>

        <p className={styles.back}>
          <Link href="/">回到網站</Link>
        </p>
      </Panel>
    </main>
  );
}
