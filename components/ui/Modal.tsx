"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import styles from "./Modal.module.css";
import { cx, type Tone } from "./tones";

type ModalProps = {
  open: boolean;
  /** Called on Esc, the close button, or a click on the backdrop. */
  onClose: () => void;
  title: ReactNode;
  tone?: Tone;
  className?: string;
  children: ReactNode;
};

/**
 * Built on the native <dialog> with showModal(): the rest of the page becomes inert, so focus stays
 * inside, Esc closes it, and focus returns to the opener afterwards.
 */
export function Modal({ open, onClose, title, tone = "paper", className, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={styles.dialog}
      onClose={onClose}
      // The dialog has no padding, so a click whose target is the dialog itself landed on the backdrop.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      // Keep keys and the wheel from reaching the book, which would flip pages behind the modal.
      onKeyDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div data-tone={tone} className={cx(styles.box, className)}>
        <header className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="關閉">
            ×
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </dialog>
  );
}
