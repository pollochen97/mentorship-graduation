import type { Metadata } from "next";
import { Callback } from "./Callback";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "登入中 · ENG曼陀號" };

/** Where Google's sign-in comes back to (#55, lib/auth.ts): finishes it, then returns to the book. */
export default function CallbackPage() {
  return (
    <main className={styles.main}>
      <Callback />
    </main>
  );
}
