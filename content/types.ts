// Shapes of the static content in content/*.ts (#4). The data files belong to #6 and #7.
// Optional fields can be left out; the page then hides the matching element.
import type { Accent, Photo, PhotoLayout } from "@/components/ui";

export type StaffMember = {
  /** e.g. 船長、引水人、助教、客座講師 */
  role: string;
  name: string;
  /** One line. */
  intro?: string;
  /** Path under public/, e.g. "/photos/staff/captain.jpg". */
  photo?: string;
};

export type Sailor = {
  /** Stable id, e.g. "s07"; also picks the illustrated avatar for sailors without a photo. */
  id: string;
  /** Shown on the card; 航海士 come first in the list. */
  rank: "航海士" | "水手";
  name: string;
  motto?: string;
  /** Path under public/; only for sailors who agreed to show it. */
  photo?: string;
  /** Full URL; only for sailors who agreed to show it. */
  linkedin?: string;
};

export type SectionKey = "audition" | "welcome" | "m1" | "m2" | "m3" | "m4" | "meetups";

/** A chapter built on SectionPage (#11). */
export type Section = {
  /** Text after "LOG 06 ·" on the chapter label, e.g. the meeting's theme. */
  tag: string;
  title: string;
  /** Shown as a stamp, e.g. "2026.07.26" or "2026.06.14 — 06.15". */
  date: string;
  /** One short paragraph, about 50–80 characters. */
  text?: string;
  /** Bullet points under the text, e.g. a monthly meeting's agenda. */
  outline?: string[];
  accent: Accent;
  /** hero = 1 photo, grid2 = 2, grid3 = 6, mosaic = 3. Missing photos show a placeholder. */
  layout: PhotoLayout;
  /** Paths under public/, e.g. { src: "/photos/m1/01.jpg", alt: "分組討論" }. */
  photos: Photo[];
  /** Big numbers in boxes, e.g. applicant count (audition). */
  stats?: { value: string; label: string }[];
  /** Numbered steps above the photos, e.g. the audition process. */
  steps?: string[];
};

/** One of the six final projects (#12). */
export type Project = {
  id: string;
  name: string;
  /** e.g. "第 1 組" */
  team?: string;
  /** Path under public/, e.g. "/photos/final/p1.jpg". */
  image?: string;
  /** Where the QR code points. */
  url: string;
};
