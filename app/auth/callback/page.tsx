import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ARCHIVE } from "@/lib/archive";
import { Callback } from "./Callback";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "登入中 · ENG曼陀號" };

/** Where Google's sign-in comes back to (#55, lib/auth.ts): finishes it, then returns to the book. */
export default function CallbackPage() {
  // Nobody signs in on the archived site (spec 3.6).
  if (ARCHIVE) redirect("/");
  return (
    <main className={styles.main}>
      <Callback />
    </main>
  );
}
