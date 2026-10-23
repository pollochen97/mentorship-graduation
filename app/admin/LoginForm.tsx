"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { adminFetch } from "./adminApi";
import styles from "./admin.module.css";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await adminFetch("/login", null, { method: "POST", body: { password } });
    if (r.ok) {
      router.refresh(); // the server sees the new cookie and shows the dashboard
      return;
    }
    setBusy(false);
    setError(r.error.message);
  }

  return (
    <form className={styles.card} onSubmit={submit}>
      <p className={styles.kicker}>ENG曼陀號 · 結業分享</p>
      <h1 className={styles.title}>管理後台</h1>
      <label className={styles.field}>
        <span>密碼</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className={styles.primary} disabled={busy}>
        {busy ? "登入中…" : "登入"}
      </button>
    </form>
  );
}
