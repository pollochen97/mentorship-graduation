"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { UploadTicket } from "@/app/api/admin/final-photo/schemas";
import { cx } from "@/components/ui";
import { Settings } from "@/lib/schemas";
import { adminFetch } from "./adminApi";
import styles from "./admin.module.css";
import own from "./PhotoUpload.module.css";

/** Spec 3.3: shrink on the phone first, so the upload is quick on the venue Wi-Fi. */
const MAX_SIDE = 2400;
const JPEG_QUALITY = 0.85;

type State =
  | { step: "idle" }
  | { step: "shrinking" }
  | { step: "ready"; photo: Blob }
  | { step: "uploading"; photo: Blob; label: string; progress: number | null }
  | { step: "failed"; photo: Blob; error: string }
  | { step: "done" }
  // Clearing the photo on the projector (#64): asked to confirm first, since it can't be undone here.
  | { step: "confirmClear" }
  | { step: "clearing" }
  | { step: "clearFailed"; error: string }
  | { step: "cleared" };

/** Longest side down to MAX_SIDE, re-encoded as JPEG. Also applies the EXIF rotation of phone photos. */
async function shrink(file: File) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject()), "image/jpeg", JPEG_QUALITY),
  );
}

/** PUTs the photo to a signed upload URL with XHR, which (unlike fetch) reports upload progress. */
function putPhoto(url: string, photo: Blob, onProgress: (share: number) => void) {
  return new Promise<string | null>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", "image/jpeg");
    // Every upload gets a new name, so the file never changes and can be cached for good.
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => resolve(xhr.status < 300 ? null : `上傳失敗（${xhr.status}）`);
    xhr.onerror = () => resolve("網路連線不穩，上傳失敗");
    xhr.send(photo);
  });
}

type PhotoUploadProps = {
  /** The photo on the projector now, from the dashboard's settings. */
  current: string | null;
  /** Called after the projector got a new photo or none, so the dashboard reloads its settings. */
  onChanged: () => void;
};

/**
 * The admin shoots or picks the group photo on their phone; the projector shows it at once (#20).
 * Before the event, the rehearsal's test photo can be cleared again (#64).
 */
export function PhotoUpload({ current, onChanged }: PhotoUploadProps) {
  const router = useRouter();
  const [state, setState] = useState<State>({ step: "idle" });
  const [preview, setPreview] = useState<string | null>(null);
  // Shown when a picked file can't be read; inline, since a browser alert would block the page.
  const [pickError, setPickError] = useState("");
  const camera = useRef<HTMLInputElement>(null);
  const album = useRef<HTMLInputElement>(null);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  async function choose(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // so picking the same file again still fires change
    if (!file) return;
    setPickError("");
    setState({ step: "shrinking" });
    try {
      const photo = await shrink(file);
      setPreview(URL.createObjectURL(photo));
      setState({ step: "ready", photo });
    } catch {
      setPreview(null);
      setState({ step: "idle" });
      setPickError("無法讀取這張照片，請換一張或改用 JPEG");
    }
  }

  async function upload(photo: Blob) {
    const fail = (error: string) => setState({ step: "failed", photo, error });
    setState({ step: "uploading", photo, label: "準備上傳…", progress: null });

    const ticket = await adminFetch("/final-photo", UploadTicket, { method: "POST" });
    if (!ticket.ok) {
      if (ticket.error.code === "unauthorized") return router.refresh();
      return fail(ticket.error.message);
    }

    const putError = await putPhoto(ticket.data.signedUrl, photo, (share) =>
      setState({ step: "uploading", photo, label: "上傳中", progress: share }),
    );
    if (putError) return fail(putError);

    setState({ step: "uploading", photo, label: "更新投影畫面…", progress: 1 });
    const done = await adminFetch("/final-photo", Settings, {
      method: "PUT",
      body: { path: ticket.data.path },
    });
    if (!done.ok) {
      if (done.error.code === "unauthorized") return router.refresh();
      return fail(done.error.message);
    }
    setPreview(null);
    setState({ step: "done" });
    onChanged();
  }

  async function clear() {
    setState({ step: "clearing" });
    const r = await adminFetch("/final-photo", Settings, { method: "DELETE" });
    if (!r.ok) {
      if (r.error.code === "unauthorized") return router.refresh();
      return setState({ step: "clearFailed", error: r.error.message });
    }
    setState({ step: "cleared" });
    onChanged();
  }

  const busy =
    state.step === "shrinking" || state.step === "uploading" || state.step === "clearing";
  // Offered only while the projector has a photo and nothing new is picked.
  const canClear =
    !!current && (state.step === "idle" || state.step === "done" || state.step === "clearFailed");
  const hasPhoto = state.step === "ready" || state.step === "failed";

  return (
    <section className={styles.card}>
      <h2 className={styles.heading}>大合照</h2>
      <p className={styles.hint}>拍好後上傳，投影畫面的大合照頁會立刻換上新照片。</p>

      {/* Both inputs stay in the DOM; the buttons below open them. */}
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={choose}
      />
      <input ref={album} type="file" accept="image/*" hidden onChange={choose} />

      {preview && state.step !== "done" ? (
        // eslint-disable-next-line @next/next/no-img-element -- a local blob: preview
        <img src={preview} alt="準備上傳的大合照" className={own.photo} />
      ) : current ? (
        <figure className={own.current}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Storage URL, shown as is */}
          <img src={current} alt="投影中的大合照" className={own.photo} />
          <figcaption className={styles.hint}>目前投影中的照片</figcaption>
        </figure>
      ) : (
        <p className={own.empty}>還沒有上傳大合照</p>
      )}

      {state.step === "shrinking" && <p className={styles.hint}>處理照片中…</p>}

      {state.step === "uploading" && (
        <div className={own.progress} role="status">
          <span>
            {state.label}
            {state.progress !== null &&
              state.label === "上傳中" &&
              ` ${Math.round(state.progress * 100)}%`}
          </span>
          <progress max={1} value={state.progress ?? undefined} />
        </div>
      )}

      {state.step === "failed" && (
        <p className={cx(styles.message, styles.error)} role="alert">
          {state.error}
        </p>
      )}
      {pickError && (
        <p className={cx(styles.message, styles.error)} role="alert">
          {pickError}
        </p>
      )}
      {state.step === "done" && (
        <p className={styles.message} role="status">
          已上傳，投影畫面已換上新照片
        </p>
      )}
      {state.step === "cleared" && (
        <p className={styles.message} role="status">
          已清除，投影畫面回到「等待合照上傳中…」
        </p>
      )}
      {state.step === "clearFailed" && (
        <p className={cx(styles.message, styles.error)} role="alert">
          清除失敗：{state.error}
        </p>
      )}

      {state.step === "confirmClear" && (
        <div className={own.confirm} role="alertdialog" aria-label="確認清除大合照">
          <p>確定要清除大合照嗎？投影畫面會回到「等待合照上傳中…」，要再看到照片得重新上傳。</p>
          <div className={own.confirmActions}>
            <button type="button" className={styles.danger} onClick={clear}>
              確定清除
            </button>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setState({ step: "idle" })}
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className={own.actions}>
        {hasPhoto && (
          <button
            type="button"
            className={cx(styles.primary, styles.big)}
            onClick={() => upload(state.photo)}
          >
            {state.step === "failed" ? "重試上傳" : "上傳到投影"}
          </button>
        )}
        <button
          type="button"
          className={hasPhoto ? styles.secondary : cx(styles.primary, styles.big)}
          disabled={busy}
          onClick={() => camera.current?.click()}
        >
          {hasPhoto ? "重拍" : "拍照上傳"}
        </button>
        <button
          type="button"
          className={styles.secondary}
          disabled={busy}
          onClick={() => album.current?.click()}
        >
          從相簿選
        </button>
        {canClear && (
          <button
            type="button"
            className={styles.danger}
            onClick={() => setState({ step: "confirmClear" })}
          >
            清除大合照
          </button>
        )}
        {state.step === "clearing" && <p className={styles.hint}>清除中…</p>}
      </div>
    </section>
  );
}
