import type { Metadata } from "next";
import { Suspense } from "react";
import { isAdmin } from "@/app/api/admin/auth";
import { ARCHIVE } from "@/lib/archive";
import { Dashboard } from "./Dashboard";
import { LoginForm } from "./LoginForm";
import styles from "./admin.module.css";

// The on-site control panel (#19, spec 3.4), built for a phone. Doesn't subscribe to Realtime (spec
// 3.5): lists reload after each action or with the refresh button.
export const metadata: Metadata = { title: "管理後台 · ENG曼陀號" };

// The server checks the httpOnly admin cookie and picks the screen.
async function Gate() {
  return (await isAdmin()) ? <Dashboard /> : <LoginForm />;
}

export default function AdminPage() {
  // The archived site (spec 3.6) has no database to control.
  if (ARCHIVE) {
    return (
      <main className={styles.main}>
        <section className={styles.card}>
          <h1>網站已封存</h1>
          <p className={styles.hint}>留言已匯出成靜態檔案，網站不再連接資料庫，後台也一併停用。</p>
        </section>
      </main>
    );
  }
  return (
    <main className={styles.main}>
      <Suspense fallback={<p className={styles.hint}>載入中…</p>}>
        <Gate />
      </Suspense>
    </main>
  );
}
