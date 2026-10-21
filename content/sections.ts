// Content for the chapters built on SectionPage (#11): audition, welcome, monthly meetings 1–3, meetups.
// The shape is set by #11; the values belong to #7.
// TODO(#7): everything below is sample copy from docs/flipbook-demo.html. Replace the dates, text,
// numbers and steps with the real ones, and add photos under public/photos/<key>/.
import type { Accent, Photo, PhotoLayout } from "@/components/ui";

export type SectionKey = "audition" | "welcome" | "m1" | "m2" | "m3" | "meetups";

export type SectionContent = {
  /** Text after "LOG 06 ·" on the chapter label, e.g. the meeting's theme. */
  tag: string;
  title: string;
  /** Shown as a stamp, e.g. "2026.07.26" or "2026.06.14 — 06.15". */
  date: string;
  /** Small text on the stamp; defaults to "Port of call". */
  place?: string;
  /** One short paragraph, about 50–80 characters. */
  text: string;
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

export const SECTIONS: Record<SectionKey, SectionContent> = {
  audition: {
    tag: "AUDITION",
    title: "海選",
    date: "2026.06.14 — 06.15",
    text: "一百多位報名者、兩天面試。每個人都帶著自己的故事來，最後只能選出 24 位水手。",
    accent: "yellow",
    layout: "grid2",
    photos: [],
    stats: [
      { value: "112", label: "報名人數" },
      { value: "24", label: "錄取水手" },
      { value: "2", label: "天面試" },
    ],
    steps: ["線上報名", "書面審查", "面試", "錄取通知"],
  },
  welcome: {
    tag: "WELCOME",
    title: "相見歡",
    date: "2026.07.05",
    text: "第一次見面，名牌比臉還大。破冰遊戲玩到一半，大家已經開始互相取綽號。",
    accent: "pink",
    layout: "grid2",
    photos: [],
  },
  m1: {
    tag: "卓越工程師",
    title: "第一次月會",
    date: "2026.07.26",
    text: "主題是卓越工程師的軟實力。分組、定目標、認識彼此的專長，白板寫滿了，便利貼也用完了兩包。",
    accent: "blue",
    layout: "grid3",
    photos: [],
  },
  m2: {
    tag: "SSD 開發流程",
    title: "第二次月會",
    date: "2026.08.23",
    text: "從需求到上線，一起走過一次 SSD 開發流程。有人準備了十頁簡報，有人只帶了一張照片，兩種都很好。",
    accent: "mint",
    layout: "mosaic",
    photos: [],
  },
  m3: {
    tag: "PM x ENG",
    title: "第三次月會",
    date: "2026.09.20",
    text: "PM 和工程師的跨組交流：上半場 pitch，下半場爐邊會談，問題一路問到散場。",
    accent: "yellow",
    layout: "mosaic",
    photos: [],
  },
  meetups: {
    tag: "MEETUPS",
    title: "各種小聚",
    date: "2026.07 — 10",
    text: "co-working、月會後的聚餐。月會之外，這些才是大家真正變熟的時候。",
    accent: "pink",
    layout: "grid3",
    photos: [],
  },
};

export function isSectionKey(key: string): key is SectionKey {
  return Object.hasOwn(SECTIONS, key);
}
