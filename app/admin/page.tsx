import type { Metadata } from "next";
import { Suspense } from "react";
import { isAdmin } from "@/app/api/admin/auth";
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
  return (
    <main className={styles.main}>
      <Suspense fallback={<p className={styles.hint}>載入中…</p>}>
        <Gate />
      </Suspense>
    </main>
  );
}
