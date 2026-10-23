"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AdminDanmakuList,
  AdminDanmakuResponse,
  AdminNoteList,
  AdminNoteResponse,
  type AdminDanmaku,
  type AdminNote,
} from "@/app/api/admin/schemas";
import { cx } from "@/components/ui";
import type { ApiResult } from "@/lib/api";
import { Settings, type ApiError, type NoteSection } from "@/lib/schemas";
import { adminFetch } from "./adminApi";
import styles from "./admin.module.css";
import { PhotoUpload } from "./PhotoUpload";

const SECTIONS: { key: NoteSection | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "m1", label: "月會 1" },
  { key: "m2", label: "月會 2" },
  { key: "m3", label: "月會 3" },
  { key: "m4", label: "Final" },
];
const SECTION_LABEL = Object.fromEntries(SECTIONS.map((s) => [s.key, s.label]));

const time = new Intl.DateTimeFormat("zh-TW", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Asia/Taipei",
});
const dateTime = new Intl.DateTimeFormat("zh-TW", {
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Taipei",
});

type Message = { text: string; error?: boolean };

export function Dashboard() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [danmaku, setDanmaku] = useState<AdminDanmaku[] | null>(null);
  const [notes, setNotes] = useState<AdminNote[] | null>(null);
  const [section, setSection] = useState<NoteSection | "all">("all");
  // Bumped to reload every list: after each action, and by the refresh button.
  const [tick, setTick] = useState(0);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  // The action waiting for an answer, e.g. "settings" or "danmaku:12"; its button is disabled.
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(null);

  // A 401 means the session ran out: refreshing makes the server show the login form.
  const fail = useCallback(
    (error: ApiError) => {
      if (error.code === "unauthorized") router.refresh();
      else setMessage({ text: error.message, error: true });
    },
    [router],
  );

  useEffect(() => {
    let stale = false;
    const load = <T,>(request: Promise<ApiResult<T>>, set: (data: T) => void) =>
      request.then((r) => {
        if (stale) return;
        if (r.ok) set(r.data);
        else fail(r.error);
      });
    void Promise.all([
      load(adminFetch("/settings", Settings), setSettings),
      load(adminFetch("/danmaku", AdminDanmakuList), (d) => setDanmaku(d.danmaku)),
      load(
        adminFetch(section === "all" ? "/notes" : `/notes?section=${section}`, AdminNoteList),
        (d) => setNotes(d.notes),
      ),
    ]).then(() => !stale && setLoadedAt(new Date()));
    return () => {
      stale = true;
    };
  }, [tick, section, fail]);

  async function act(key: string, run: () => Promise<ApiResult<unknown>>, done: string) {
    setBusy(key);
    setMessage(null);
    const r = await run();
    setBusy(null);
    if (!r.ok) return fail(r.error);
    setMessage({ text: done });
    setTick((t) => t + 1);
  }

  async function logout() {
    await adminFetch("/logout", null, { method: "POST" });
    router.refresh();
  }

  const paused = settings?.danmakuEnabled === false;

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>ENG曼陀號 · 結業分享</p>
          <h1 className={styles.title}>管理後台</h1>
        </div>
        <button type="button" className={styles.secondary} onClick={logout}>
          登出
        </button>
      </header>

      <div className={styles.toolbar}>
        <button type="button" className={styles.secondary} onClick={() => setTick((t) => t + 1)}>
          重新整理
        </button>
        <span className={styles.hint}>
          {loadedAt ? `更新於 ${time.format(loadedAt)}` : "載入中…"}
        </span>
      </div>

      {message && (
        <p className={cx(styles.message, message.error && styles.error)} role="status">
          {message.text}
        </p>
      )}

      <section className={cx(styles.card, paused ? styles.pausedCard : styles.liveCard)}>
        <h2 className={styles.heading}>彈幕總開關</h2>
        <p className={styles.state}>
          {settings === null ? "讀取中…" : paused ? "⏸ 彈幕已暫停" : "▶ 彈幕進行中"}
        </p>
        <p className={styles.hint}>暫停後投影端的彈幕會立刻消失，手機送出會顯示「彈幕暫停中」。</p>
        <button
          type="button"
          className={cx(styles.big, paused ? styles.primary : styles.danger)}
          disabled={settings === null || busy === "settings"}
          onClick={() =>
            act(
              "settings",
              () =>
                adminFetch("/settings", Settings, {
                  method: "PUT",
                  body: { danmakuEnabled: paused },
                }),
              paused ? "已恢復彈幕" : "已暫停全部彈幕",
            )
          }
        >
          {paused ? "恢復彈幕" : "暫停全部彈幕"}
        </button>
      </section>

      <PhotoUpload
        current={settings?.finalPhotoUrl ?? null}
        onUploaded={() => setTick((t) => t + 1)}
      />

      <section className={styles.card}>
        <h2 className={styles.heading}>最新 50 則彈幕</h2>
        {danmaku === null ? (
          <p className={styles.hint}>讀取中…</p>
        ) : danmaku.length === 0 ? (
          <p className={styles.hint}>還沒有彈幕</p>
        ) : (
          <ul className={styles.list}>
            {danmaku.map((d) => (
              <li key={d.id} className={cx(styles.row, d.hidden && styles.hidden)}>
                <div className={styles.text}>
                  <span className={styles.meta}>
                    #{d.id} · {time.format(new Date(d.createdAt))}
                    {d.hidden && " · 已下架"}
                  </span>
                  <span>
                    <b>{d.name}</b>：{d.body}
                  </span>
                </div>
                <button
                  type="button"
                  className={d.hidden ? styles.secondary : styles.danger}
                  disabled={busy === `danmaku:${d.id}`}
                  onClick={() =>
                    act(
                      `danmaku:${d.id}`,
                      () =>
                        adminFetch(`/danmaku/${d.id}`, AdminDanmakuResponse, {
                          method: "PATCH",
                          body: { hidden: !d.hidden },
                        }),
                      d.hidden ? `已恢復 #${d.id}（不會再飄一次）` : `已下架 #${d.id}`,
                    )
                  }
                >
                  {d.hidden ? "恢復" : "下架"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.card}>
        <h2 className={styles.heading}>留言</h2>
        <div className={styles.tabs} role="group" aria-label="留言板">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              aria-pressed={section === s.key}
              onClick={() => {
                if (s.key === section) return;
                // Clear the old list so its buttons can't act on the previous guestbook meanwhile.
                setNotes(null);
                setSection(s.key);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        {notes === null ? (
          <p className={styles.hint}>讀取中…</p>
        ) : notes.length === 0 ? (
          <p className={styles.hint}>沒有留言</p>
        ) : (
          <ul className={styles.list}>
            {notes.map((n) => (
              <li key={n.id} className={cx(styles.row, n.hidden && styles.hidden)}>
                <div className={styles.text}>
                  <span className={styles.meta}>
                    {SECTION_LABEL[n.section]} · {dateTime.format(new Date(n.createdAt))}
                    {n.hidden && " · 已隱藏"}
                  </span>
                  <span>
                    <b>{n.name}</b>：{n.body}
                  </span>
                </div>
                <button
                  type="button"
                  className={n.hidden ? styles.secondary : styles.danger}
                  disabled={busy === `note:${n.id}`}
                  onClick={() =>
                    act(
                      `note:${n.id}`,
                      () =>
                        adminFetch(`/notes/${n.id}`, AdminNoteResponse, {
                          method: "PATCH",
                          body: { hidden: !n.hidden },
                        }),
                      n.hidden ? "已取消隱藏" : "已隱藏留言",
                    )
                  }
                >
                  {n.hidden ? "取消隱藏" : "隱藏"}
                </button>
              </li>
            ))}
          </ul>
        )}
        {notes?.length === 200 && <p className={styles.hint}>只顯示最新 200 則</p>}
      </section>
    </div>
  );
}
