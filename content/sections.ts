// Content for the chapters built on SectionPage (#11): audition, welcome, monthly meetings 1–4, meetups.
// The shape is in content/types.ts; the values belong to #7.
// TODO(#7): the audition steps and the meetups date are still sample copy, and meetups is one photo
// short. Photo alt texts are placeholders too.
import type { Photo } from "@/components/ui";
import type { Section, SectionKey } from "./types";

/** public/photos/<key>/01.jpg, 02.jpg, … */
function photos(key: SectionKey, count: number, alt: string): Photo[] {
  return Array.from({ length: count }, (_, i) => ({
    src: `/photos/${key}/${String(i + 1).padStart(2, "0")}.jpg`,
    alt: `${alt} ${i + 1}`,
  }));
}

export const SECTIONS: Record<SectionKey, Section> = {
  audition: {
    tag: "AUDITION",
    title: "海選",
    date: "2026.05.09",
    text: "緊張的分組討論，才發現大家都好厲害。第一天結束，手機裡已經多了好多 IG 和 LinkedIn。",
    accent: "yellow",
    layout: "grid2",
    photos: photos("audition", 2, "海選"),
    steps: ["線上報名", "書面審查", "面試", "錄取通知"],
  },
  welcome: {
    tag: "WELCOME",
    title: "相見歡",
    date: "2026.06.13",
    text: "從三個情境找出我的故事開始破冰！有人很愛上班爬牆、有人行李買錯托運、還有人只去神奇的國家（剛從蒙古回來？！）",
    accent: "pink",
    layout: "grid2",
    photos: photos("welcome", 2, "相見歡"),
  },
  m1: {
    tag: "卓越軟體工程師的知識管理與 AI 賦能",
    title: "第一次月會",
    date: "2026.06.28",
    outline: ["軟體工程師專業核心能力", "學習的認知科學、工具，以及 AI 輔助學習", "學習經驗分享"],
    accent: "blue",
    layout: "grid3",
    photos: photos("m1", 6, "第一次月會"),
  },
  m2: {
    tag: "現代軟體工程範式：測試驅動與 AI 協同開發",
    title: "第二次月會",
    date: "2026.07.26",
    outline: ["開發者的測試思維", "AI 本位開發思維：Agentic Development & AI in SDLC"],
    accent: "mint",
    layout: "mosaic",
    photos: photos("m2", 3, "第二次月會"),
  },
  m3: {
    tag: "ENG x PM 跨職能協作工作坊",
    title: "第三次月會",
    date: "2026.08.30",
    outline: ["船長對談", "跨職能協作工作坊"],
    accent: "yellow",
    layout: "mosaic",
    photos: photos("m3", 3, "第三次月會"),
  },
  m4: {
    tag: "專案發表 x 大型軟體公司職場術：從優秀到卓越工程師",
    title: "第四次月會",
    date: "2026.10.04",
    outline: [
      "工作坊專案發表",
      "大型軟體公司職場生存術",
      "技術影響力與濕技能",
      "講師哲西分享 AI 時代軟體測試知識",
    ],
    accent: "blue",
    layout: "grid3",
    photos: photos("m4", 6, "第四次月會"),
  },
  meetups: {
    tag: "MEETUPS",
    title: "各種小聚",
    date: "2026.07 — 10",
    text: "月會後的聚餐、一起 co-working、一起去聽 COSCUP。月會之外，這些才是大家真正變熟的時候。",
    accent: "pink",
    layout: "grid3",
    photos: photos("meetups", 5, "各種小聚"),
  },
};

export function isSectionKey(key: string): key is SectionKey {
  return Object.hasOwn(SECTIONS, key);
}
