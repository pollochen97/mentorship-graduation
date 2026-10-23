"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Button, Modal, ACCENTS, cx } from "@/components/ui";
import type { ApiResult } from "@/lib/api";
import { useMember, type Member } from "@/lib/auth";
import { charCount, LIMITS, type Note, type NoteInput } from "@/lib/schemas";
import styles from "./NotePad.module.css";

type Post = (input: Omit<NoteInput, "section">) => Promise<ApiResult<Note>>;
type Writer = Extract<Member, { status: "signedIn" }>;

// The pad's first colour is random per visit. It is picked in the browser only (the server renders
// colour 0), so the server-rendered page and the browser's first render agree.
const FIRST_COLOR = Math.floor(Math.random() * ACCENTS.length);
const noSubscribe = () => () => {};

/**
 * What the pad's form holds, shared by the pad on the board and the sheet on narrow screens.
 * The name starts as the writer's Google name, cut to fit, until they type their own.
 * `onRefused` runs when the server says the sign-in is gone or not on the whitelist (#55).
 */
function useDraft(post: Post, googleName: string, onRefused: () => void) {
  const [typedName, setName] = useState<string | null>(null);
  const name = typedName ?? [...googleName].slice(0, LIMITS.noteName).join("");
  const [body, setBody] = useState("");
  // Each posted note moves the pad on to a different colour.
  const [shift, setShift] = useState(0);
  const first = useSyncExternalStore(
    noSubscribe,
    () => FIRST_COLOR,
    () => 0,
  );
  const color = (first + shift) % ACCENTS.length;
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Seconds until the rate limit lets the next note through (429).
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const nameCount = charCount(name.trim());
  const bodyCount = charCount(body.trim());
  const valid =
    nameCount > 0 && nameCount <= LIMITS.noteName && bodyCount > 0 && bodyCount <= LIMITS.noteBody;

  async function submit() {
    if (!valid || sending || wait > 0) return false;
    setSending(true);
    setMessage(null);
    const r = await post({ name: name.trim(), body: body.trim(), color });
    setSending(false);
    if (r.ok) {
      setBody("");
      setShift((s) => s + 1 + Math.floor(Math.random() * (ACCENTS.length - 1)));
      return true;
    }
    if (r.error.code === "rate_limited" && r.error.retryAfter)
      setWait(Math.ceil(r.error.retryAfter));
    else setMessage(r.error.message);
    if (r.error.code === "unauthorized" || r.error.code === "not_allowed") onRefused();
    return false;
  }

  return {
    name,
    setName,
    body,
    setBody,
    color,
    nameCount,
    bodyCount,
    canSend: valid && !sending && wait <= 0,
    sending,
    status: wait > 0 ? `太快了，請 ${wait} 秒後再試` : message,
    submit,
  };
}

type Draft = ReturnType<typeof useDraft>;

/**
 * Enter sends; Shift+Enter is ignored (notes are one line once stored). While an IME is composing,
 * Enter picks the candidate: leave it to the IME, untouched (keyCode 229 for older Safari).
 */
function onKeyDown(e: KeyboardEvent<HTMLFormElement>) {
  if (e.key !== "Enter") return;
  if (e.nativeEvent.isComposing || e.keyCode === 229) return;
  if (e.target instanceof HTMLTextAreaElement) {
    e.preventDefault();
    if (!e.shiftKey) e.currentTarget.requestSubmit();
  }
}

type Variant = "pad" | "sheet";

function NoteForm({
  draft,
  variant,
  writer,
  onSignOut,
  onSent,
}: {
  draft: Draft;
  variant: Variant;
  writer: Writer;
  onSignOut: () => void;
  onSent?: () => void;
}) {
  const over = (count: number, max: number) => cx(styles.count, count > max && styles.over);
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (await draft.submit()) onSent?.();
  }
  return (
    <form
      className={cx(styles.form, styles[variant])}
      data-tone={ACCENTS[draft.color]}
      autoComplete="off"
      onSubmit={onSubmit}
      onKeyDown={onKeyDown}
    >
      <div className={styles.row}>
        <input
          className={styles.name}
          value={draft.name}
          onChange={(e) => draft.setName(e.target.value)}
          placeholder="你的名字"
          aria-label="姓名"
        />
        <span className={over(draft.nameCount, LIMITS.noteName)}>
          {draft.nameCount}/{LIMITS.noteName}
        </span>
      </div>
      <textarea
        className={styles.body}
        value={draft.body}
        onChange={(e) => draft.setBody(e.target.value)}
        placeholder="寫下你的留言…"
        aria-label="留言內容"
      />
      <div className={styles.row}>
        <span className={over(draft.bodyCount, LIMITS.noteBody)}>
          {draft.bodyCount}/{LIMITS.noteBody}
        </span>
        <Button type="submit" className={styles.send} disabled={!draft.canSend}>
          {draft.sending ? "貼上中…" : "貼上 ↗"}
        </Button>
      </div>
      <p className={styles.status} role="status">
        {draft.status}
      </p>
      <p className={styles.account}>
        <span className={styles.email}>{writer.email}</span>
        <button type="button" className={styles.link} onClick={onSignOut}>
          登出
        </button>
      </p>
    </form>
  );
}

/** "line" or "other" inside an app's built-in browser, where Google refuses to sign in; else null. */
function inAppBrowser() {
  const ua = navigator.userAgent;
  if (/\bLine\//i.test(ua)) return "line";
  if (/FBAN|FBAV|FB_IAB|Instagram|Threads|MicroMessenger|KAKAOTALK/i.test(ua)) return "other";
  return null;
}

/** LINE opens a URL carrying openExternalBrowser=1 in the phone's default browser. */
function openInBrowser() {
  const url = new URL(location.href);
  url.searchParams.set("openExternalBrowser", "1");
  location.href = url.toString();
}

/**
 * In place of the form until the reader may write (#55): signing in, or why they can't. Notes are
 * for ENG members only; the server checks again on every note.
 */
function Gate({ member, variant, tone }: { member: Member; variant: Variant; tone: string }) {
  const { signIn, recheck } = useMember();
  const app = useSyncExternalStore(noSubscribe, inAppBrowser, () => null);
  let text = "載入中…";
  let actions = null;
  if (member.status === "signedOut" && app === "line") {
    text = "LINE 裡無法用 Google 登入，請改用瀏覽器開啟。沒反應的話，從右上角選單改用瀏覽器開啟。";
    actions = <Button onClick={openInBrowser}>用瀏覽器開啟</Button>;
  } else if (member.status === "signedOut" && app) {
    text = "這個 App 裡無法用 Google 登入，請用 Safari 或 Chrome 開啟這個網頁。";
  } else if (member.status === "signedOut") {
    text = "留言限 ENG 夥伴，請先用 Google 登入。";
    actions = <Button onClick={signIn}>用 Google 登入</Button>;
  } else if (member.status === "signedIn" && member.access === "checking") {
    text = `正在確認 ${member.email} 是否在 ENG 名單內…`;
  } else if (member.status === "signedIn" && member.access === "error") {
    text = `無法確認 ${member.email} 是否在 ENG 名單內，請檢查網路後再試一次。`;
    actions = (
      <>
        <Button onClick={recheck}>再試一次</Button>
        <Button variant="secondary" onClick={signIn}>
          換帳號
        </Button>
      </>
    );
  } else if (member.status === "signedIn") {
    text = `${member.email} 不在 ENG 名單內。`;
    actions = (
      <>
        <Button onClick={signIn}>換帳號</Button>
        <Button variant="secondary" onClick={recheck}>
          重新確認
        </Button>
      </>
    );
  }
  return (
    <div className={cx(styles.form, styles[variant], styles.gate)} data-tone={tone}>
      <p className={styles.gateText} role="status">
        {text}
      </p>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

/**
 * The pad in the board's bottom-right corner: name, note and a send button, with live character
 * counts. On a narrow page the corner is too small to type in, so it opens the form in a modal.
 * Only a Google sign-in on the whitelist gets the form, and only while the admin has the guestbooks
 * open (`enabled`, #55); until then the pad says why.
 */
export function NotePad({
  post,
  title,
  enabled,
}: {
  post: Post;
  title: string;
  enabled: boolean | null;
}) {
  const { member, signOut, recheck } = useMember();
  // Only once the server has confirmed the address: no form while asking or after asking failed.
  const writer = member.status === "signedIn" && member.access === "allowed" ? member : null;
  const draft = useDraft(post, writer?.name ?? "", recheck);
  const [open, setOpen] = useState(false);

  if (enabled === false) {
    return (
      <div className={styles.closed}>
        <p>
          留言已截止
          <br />
          謝謝大家 ♥
        </p>
      </div>
    );
  }

  const tone = ACCENTS[draft.color];
  const content = (variant: Variant, onSent?: () => void) =>
    writer && enabled ? (
      <NoteForm
        draft={draft}
        variant={variant}
        writer={writer}
        onSignOut={signOut}
        onSent={onSent}
      />
    ) : (
      <Gate
        member={enabled === null ? { status: "loading" } : member}
        variant={variant}
        tone={tone}
      />
    );

  return (
    <>
      {content("pad")}
      <button type="button" className={styles.open} data-tone={tone} onClick={() => setOpen(true)}>
        寫便條 ✎
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} tone="paper">
        {open && content("sheet", () => setOpen(false))}
      </Modal>
    </>
  );
}
