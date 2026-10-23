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
import { charCount, LIMITS, type Note, type NoteInput } from "@/lib/schemas";
import styles from "./NotePad.module.css";

type Post = (input: Omit<NoteInput, "section">) => Promise<ApiResult<Note>>;

// The pad's first colour is random per visit. It is picked in the browser only (the server renders
// colour 0), so the server-rendered page and the browser's first render agree.
const FIRST_COLOR = Math.floor(Math.random() * ACCENTS.length);
const noSubscribe = () => () => {};

/** What the pad's form holds, shared by the pad on the board and the sheet on narrow screens. */
function useDraft(post: Post) {
  const [name, setName] = useState("");
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

/** Enter sends; Shift+Enter is ignored (notes are one line once stored). Never while an IME is composing. */
function onKeyDown(e: KeyboardEvent<HTMLFormElement>) {
  if (e.key !== "Enter") return;
  if (e.nativeEvent.isComposing || e.keyCode === 229) return e.preventDefault();
  if (e.target instanceof HTMLTextAreaElement) {
    e.preventDefault();
    if (!e.shiftKey) e.currentTarget.requestSubmit();
  }
}

function NoteForm({
  draft,
  variant,
  onSent,
}: {
  draft: Draft;
  variant: "pad" | "sheet";
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
    </form>
  );
}

/**
 * The pad in the board's bottom-right corner: name, note and a send button, with live character
 * counts. On a narrow page the corner is too small to type in, so it opens the form in a modal.
 */
export function NotePad({ post, title }: { post: Post; title: string }) {
  const draft = useDraft(post);
  const [open, setOpen] = useState(false);
  return (
    <>
      <NoteForm draft={draft} variant="pad" />
      <button
        type="button"
        className={styles.open}
        data-tone={ACCENTS[draft.color]}
        onClick={() => setOpen(true)}
      >
        寫便條 ✎
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} tone="paper">
        {open && <NoteForm draft={draft} variant="sheet" onSent={() => setOpen(false)} />}
      </Modal>
    </>
  );
}
