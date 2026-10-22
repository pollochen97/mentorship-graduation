"use client";

import { useEffect, useState, type FormEvent } from "react";
import { sendDanmaku } from "@/lib/api";
import { useDanmakuStream, useNotes, useSettings } from "@/lib/hooks";
import { USE_MOCK } from "@/lib/mock";
import { onLiveStatus, type LiveStatus } from "@/lib/realtime";
import { charCount, LIMITS, NoteSection, type Danmaku } from "@/lib/schemas";
import styles from "./page.module.css";

type MockControls = Record<string, (...args: unknown[]) => void>;
const mock = (name: string, ...args: unknown[]) =>
  (window as unknown as { __mock?: MockControls }).__mock?.[name]?.(...args);

// Only rendered for the projector: following the status opens the connection too.
function LiveStatusText() {
  const [status, setStatus] = useState<LiveStatus>("connecting");
  useEffect(() => onLiveStatus(setStatus), []);
  return <b>{status}</b>;
}

export function LiveDemo() {
  // Stands in for isProjector (spec 3.5): only the projector subscribes to Realtime.
  const [live, setLive] = useState(true);
  return (
    <main className={styles.main}>
      <header className={styles.card}>
        <h1>Live 資料</h1>
        <p>
          #4 的 hooks 實際運作的樣子。模式：<b>{USE_MOCK ? "mock（假資料）" : "Supabase"}</b> ·
          連線：
          {live ? <LiveStatusText /> : <b>不訂閱</b>}
        </p>
        <div className={styles.row}>
          <button aria-pressed={live} onClick={() => setLive(true)}>
            投影端
          </button>
          <button aria-pressed={!live} onClick={() => setLive(false)}>
            一般訪客
          </button>
        </div>
        <p className={styles.hint}>
          一般訪客只在載入時抓一次資料，不訂閱 Realtime、不收彈幕；自己送出的留言仍會出現。
        </p>
        {USE_MOCK && (
          <p className={styles.hint}>
            mock 模式下每 3 秒會自動來一則彈幕。也可以在 console 用{" "}
            <code>__mock.note(&quot;m1&quot;)</code>、<code>__mock.pause()</code>、
            <code>__mock.photo()</code> 等觸發事件（見 <code>lib/mock/index.ts</code>）。
          </p>
        )}
      </header>
      <div className={styles.grid}>
        <SettingsDemo live={live} />
        {live ? (
          <DanmakuDemo />
        ) : (
          <section className={styles.card}>
            <h2>useDanmakuStream()</h2>
            <p className={styles.hint}>只有投影端會掛上這個 hook。</p>
          </section>
        )}
        <NotesDemo live={live} />
      </div>
    </main>
  );
}

function SettingsDemo({ live }: { live: boolean }) {
  const { danmakuEnabled, finalPhotoUrl, loading } = useSettings({ live });
  return (
    <section className={styles.card}>
      <h2>useSettings({`{ live: ${live} }`})</h2>
      <pre>{JSON.stringify({ danmakuEnabled, finalPhotoUrl, loading }, null, 2)}</pre>
      {USE_MOCK && (
        <div className={styles.row}>
          <button onClick={() => mock("pause")}>暫停彈幕</button>
          <button onClick={() => mock("resume")}>恢復彈幕</button>
          <button onClick={() => mock("photo")}>上傳大合照</button>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- preview only */}
      {finalPhotoUrl && <img src={finalPhotoUrl} alt="大合照" className={styles.photo} />}
    </section>
  );
}

function DanmakuDemo() {
  const [received, setReceived] = useState<Danmaku[]>([]);
  const [removed, setRemoved] = useState<number[]>([]);
  const [name, setName] = useState("訪客");
  const [body, setBody] = useState("");
  const [result, setResult] = useState("");

  useDanmakuStream(
    (d) => setReceived((prev) => [d, ...prev].slice(0, 8)),
    (id) => setRemoved((prev) => [...prev, id]),
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    const r = await sendDanmaku({ name, body });
    setResult(
      r.ok
        ? `已送出 #${r.data.id}`
        : `${r.error.code}：${r.error.message}${r.error.retryAfter ? `（${r.error.retryAfter} 秒）` : ""}`,
    );
    if (r.ok) setBody("");
  }

  return (
    <section className={styles.card}>
      <h2>useDanmakuStream()</h2>
      <form onSubmit={submit} className={styles.row}>
        <input value={name} onChange={(e) => setName(e.target.value)} aria-label="姓名" size={6} />
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-label="內容"
          placeholder="發一則彈幕"
        />
        <span className={styles.hint}>
          {charCount(body)}/{LIMITS.danmakuBody}
        </span>
        <button>送出</button>
      </form>
      {result && <p className={styles.hint}>{result}</p>}
      <ul className={styles.list}>
        {received.map((d) => (
          <li key={d.id} className={removed.includes(d.id) ? styles.removed : undefined}>
            #{d.id} {d.name}：{d.body}
            {USE_MOCK && (
              <button className={styles.small} onClick={() => mock("remove", d.id)}>
                下架
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function NotesDemo({ live }: { live: boolean }) {
  const [section, setSection] = useState<NoteSection>("m1");
  const { notes, post, loading, error } = useNotes(section, { live });
  const [name, setName] = useState("訪客");
  const [body, setBody] = useState("");
  const [result, setResult] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const r = await post({ name, body, color: Math.floor(Math.random() * 4) });
    setResult(
      r.ok
        ? "已貼上"
        : `${r.error.code}：${r.error.message}${r.error.retryAfter ? `（${r.error.retryAfter} 秒）` : ""}`,
    );
    if (r.ok) setBody("");
  }

  return (
    <section className={styles.card}>
      <h2>
        useNotes(&quot;{section}&quot;, {`{ live: ${live} }`})
      </h2>
      <div className={styles.row}>
        {NoteSection.options.map((s) => (
          <button key={s} aria-pressed={s === section} onClick={() => setSection(s)}>
            {s}
          </button>
        ))}
        {USE_MOCK && <button onClick={() => mock("note", section)}>別人留言</button>}
      </div>
      <form onSubmit={submit} className={styles.row}>
        <input value={name} onChange={(e) => setName(e.target.value)} aria-label="姓名" size={6} />
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-label="內容"
          placeholder="寫下留言"
        />
        <span className={styles.hint}>
          {charCount(body)}/{LIMITS.noteBody}
        </span>
        <button>貼上</button>
      </form>
      {result && <p className={styles.hint}>{result}</p>}
      {error && <p className={styles.hint}>錯誤：{error.message}</p>}
      <p className={styles.hint}>{loading ? "載入中…" : `${notes.length} 則`}</p>
      <ul className={styles.list}>
        {notes.map((n) => (
          <li key={n.id}>
            {n.name}：{n.body}
            {USE_MOCK && (
              <button className={styles.small} onClick={() => mock("hide", n.id)}>
                隱藏
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
