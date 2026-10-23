"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui";
import { RETURN_KEY } from "@/lib/auth";
import { supabaseAuth } from "@/lib/supabase/browser";
import styles from "./page.module.css";

/** The book page the reader signed in from, e.g. "/#m2-guestbook". */
function returnTo() {
  try {
    return `/${sessionStorage.getItem(RETURN_KEY) ?? ""}`;
  } catch {
    return "/";
  }
}

/**
 * Creating the auth client trades the `?code=` in the URL for a session (PKCE); getSession() waits for
 * that. Without a session (the reader cancelled, or the code was already used) there is a way back.
 */
async function finish() {
  const params = new URLSearchParams(location.search);
  const supabase = supabaseAuth();
  if (!supabase || !params.has("code")) return false;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return false;
  location.replace(returnTo());
  return true;
}

export function Callback() {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    void finish().then((ok) => setFailed(!ok));
  }, []);

  return (
    <Panel as="section" tone="paper" className={styles.card}>
      <p className={styles.kicker}>ENG曼陀號結業分享</p>
      {failed ? (
        <>
          <h1 className={styles.title}>登入沒有完成</h1>
          <p className={styles.lead}>可能是取消了登入，或連結已經用過。回到留言板再試一次。</p>
          <a className={styles.back} href={returnTo()}>
            回到留言板
          </a>
        </>
      ) : (
        <h1 className={styles.title} role="status">
          登入中…
        </h1>
      )}
      <p className={styles.policy}>
        <a href="/privacy">隱私權政策</a>
      </p>
    </Panel>
  );
}
