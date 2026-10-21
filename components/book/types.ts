import type { ComponentType } from "react";

/** Chapters that have a guestbook; matches `notes.section` in the database. */
export type GuestbookSection = "m1" | "m2" | "m3" | "m4";

/** Props every chapter component receives from BookShell. */
export type PageProps = {
  /** Chapter key from pages.ts, e.g. "m1". SectionPage uses it to look up its content. */
  chapter: string;
  label: string;
  /** Chapter number, 1-based (01 封面 … 11 大合照). */
  no: number;
  /** Which page of this chapter, 0-based; only above 0 when the chapter sets pageCount. */
  pageIndex: number;
  pageCount: number;
};

export type GuestbookPageProps = {
  section: GuestbookSection;
  label: string;
  no: number;
  pageIndex: number;
  pageCount: number;
};

export type Chapter = {
  key: string;
  label: string;
  component: ComponentType<PageProps>;
  /** Pages this chapter takes (default 1). */
  pageCount?: number;
  /** Adds guestbook pages right after the chapter. */
  guestbook?: GuestbookSection;
};
