"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { Button, cx } from "@/components/ui";
import { sendDanmaku } from "@/lib/api";
import { charCount, LIMITS, type ApiError } from "@/lib/schemas";
import styles from "./page.module.css";

// Don't use lib/hooks here: this page must not open a Realtime connection (spec 3.2, 3.5).

const NAME_KEY = "danmaku-name";
const GAP_S = 5;

// localStorage throws when the browser blocks site storage.
function readName() {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {}
}

const noSubscribe = () => () => {};

type Result = { ok: true } | { ok: false; error: ApiError };

function noticeText(result: Result | null, wait: number) {
  if (!result) return "";
  if (result.ok) return "已送出！";
  if (result.error.code === "rate_limited" && result.error.retryAfter) {
    return wait > 0 ? `太快了，請 ${wait} 秒後再試` : "";
  }
  return result.error.message;
}

function Counter({ count, max }: { count: number; max: number }) {
  return (
    <span className={cx(styles.count, count > max && styles.over)}>
      {count}/{max}
    </span>
  );
}

export function DanmakuForm() {
  const savedName = useSyncExternalStore(noSubscribe, readName, () => "");
  const [typedName, setTypedName] = useState<string | null>(null);
  const name = typedName ?? savedName;
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [wait, setWait] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const nameCount = charCount(name.trim());
  const bodyCount = charCount(body.trim());
  const valid =
    nameCount > 0 &&
    nameCount <= LIMITS.danmakuName &&
    bodyCount > 0 &&
    bodyCount <= LIMITS.danmakuBody;
  const canSend = valid && !sending && wait === 0;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    setResult(null);
    const r = await sendDanmaku({ name, body });
    setSending(false);
    if (r.ok) {
      saveName(name.trim());
      setBody("");
      setWait(GAP_S);
      setResult({ ok: true });
    } else {
      if (r.error.retryAfter) setWait(Math.ceil(r.error.retryAfter));
      setResult(r);
    }
  }

  // No maxLength on the inputs: it counts UTF-16 units, so an emoji would take two.
  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <label className={styles.field}>
        <span className={styles.label}>
          姓名
          <Counter count={nameCount} max={LIMITS.danmakuName} />
        </span>
        <input
          className={styles.input}
          value={name}
          onChange={(e) => setTypedName(e.target.value)}
          autoComplete="nickname"
          placeholder="會顯示在彈幕前面"
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>
          內容
          <Counter count={bodyCount} max={LIMITS.danmakuBody} />
        </span>
        <input
          className={styles.input}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          autoComplete="off"
          enterKeyHint="send"
          placeholder="想對大家說什麼？"
        />
      </label>
      <Button type="submit" className={styles.submit} disabled={!canSend}>
        {sending ? "送出中…" : wait > 0 ? `${wait} 秒後可再發` : "送出"}
      </Button>
      <p
        className={cx(styles.notice, result && (result.ok ? styles.ok : styles.error))}
        aria-live="polite"
      >
        {noticeText(result, wait)}
      </p>
    </form>
  );
}
