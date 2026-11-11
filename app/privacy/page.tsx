import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/ui";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "隱私權政策 · ENG曼陀號" };

/**
 * The privacy policy (#56), as it stands after the event: the site is archived (spec 3.6), the
 * Google accounts and the ENG list were deleted on 2026-11-10 and the whole Supabase project on
 * 2026-11-11 (#61). It describes what the site actually keeps, so update it when that changes.
 * Linked from the sign-in on the guestbook, /danmaku, /auth/callback and the cover.
 */
export default function PrivacyPage() {
  return (
    <main className={styles.main}>
      <Panel as="article" tone="paper" className={styles.card}>
        <p className={styles.kicker}>ENG曼陀號結業分享</p>
        <h1 className={styles.title}>隱私權政策</h1>
        <p className={styles.lead}>
          這個網站是 ENG曼陀號結業分享的紀念網站，由
          ENG曼陀號的工作人員維護。活動已經結束，網站現在是唯讀的封存版。以下說明現在的網站保存哪些資料，以及活動期間收集的資料如何處理。
        </p>

        <h2 className={styles.heading}>現在的網站</h2>
        <ul className={styles.list}>
          <li>網站已經不能登入、留言或發彈幕，也不再收集或保存任何資料。</li>
          <li>網站不會設定 cookie，也不會記錄你的 IP 位址。</li>
          <li>
            網站由 Vercel 代管，Vercel
            會依它自己的服務規範處理一般的連線紀錄，我們不會另外取用這些紀錄。
          </li>
        </ul>

        <h2 className={styles.heading}>公開的留言（已封存）</h2>
        <ul className={styles.list}>
          <li>
            留言板關閉後，我們把網站上公開顯示的留言內容和署名匯出成網站的一部分。匯出的內容不包含
            email 或任何 Google 帳號資料，被管理員隱藏的留言也不會封存。
          </li>
          <li>
            這份封存存放在網站公開的程式碼庫（GitHub），任何人都看得到。彈幕和大合照不會封存，大合照已另外私下分享給夥伴。
          </li>
          <li>
            如果你不希望自己的留言被保留，請寄信到下方的信箱，我們會從網站和程式碼庫的目前版本移除。已經寫進
            Git 版本紀錄的內容，即使移除，仍可能留在過去的版本中。
          </li>
        </ul>

        <h2 className={styles.heading}>活動期間收集的資料（已刪除）</h2>
        <ul className={styles.list}>
          <li>
            <b>Google 登入</b>
            ：留言板限 ENG 夥伴使用，留言前要用 Google
            登入，看留言和發彈幕都不需要登入。登入時，Google 會提供帳號的 email、名稱、大頭貼網址和
            Google 帳號 ID，由登入服務 Supabase 存下來；Supabase 也會留下登入紀錄（時間、IP
            位址、瀏覽器資訊），用於安全稽核。
          </li>
          <li>
            我們實際<b>只使用 email 和名稱</b>
            ：email 用來確認登入的人在 ENG
            夥伴名單內，以及讓管理員知道每則留言是哪個帳號寫的；名稱用來預先填入留言的署名。大頭貼和
            Google 帳號 ID 沒有被使用或顯示。我們沒有存取任何人的 Gmail、雲端硬碟或其他 Google
            服務，email 沒有公開顯示，也沒有用來寄信。
          </li>
          <li>
            我們使用 Google 使用者資料時，遵守{" "}
            <a href="https://developers.google.com/terms/api-services-user-data-policy">
              Google API Services User Data Policy
            </a>
            ，包含其中的 Limited Use 規定。
          </li>
          <li>
            <b>防洗版</b>
            ：網站曾在瀏覽器設定一個匿名 cookie（30 天），並保存 IP
            位址經過加密雜湊後的值，只用來限制發送頻率、防止洗版。現在的網站已經不再設定這個
            cookie，留在你瀏覽器裡的會在到期後自動失效。
          </li>
          <li>
            <b>2026 年 11 月 10 日</b>
            ，我們刪除了所有 Google 登入的帳號資料和 ENG 夥伴名單，比原本承諾的 2026 年 12 月 31
            日提前。<b>2026 年 11 月 11 日</b>
            ，我們刪除了整個 Supabase 專案，原始的留言、彈幕、匿名識別碼、IP
            位址的雜湊值和大合照檔案都一併刪除。
          </li>
          <li>
            瀏覽器可能還記得你上次填的彈幕署名等設定，這些只存在你自己的裝置上，可以自行清除網站資料。
          </li>
        </ul>

        <h2 className={styles.heading}>資料的分享</h2>
        <ul className={styles.list}>
          <li>我們沒有出售、出租或分享任何人的資料給其他人。</li>
          <li>
            活動期間的資料只交由代我們提供服務的 Supabase（資料庫與登入）和
            Vercel（網站主機）存放與處理；Supabase 的資料已經全部刪除。
          </li>
        </ul>

        <h2 className={styles.heading}>聯絡我們</h2>
        <ul className={styles.list}>
          <li>
            要求移除封存的留言，或對這份政策有任何問題，歡迎寄信到{" "}
            <a href="mailto:chichichen97@gmail.com">chichichen97@gmail.com</a>
            。我們會在收到後 <b>7 天內</b>處理並回信。
          </li>
        </ul>

        <p className={styles.back}>
          <Link href="/">回到網站</Link>
        </p>
      </Panel>
    </main>
  );
}
