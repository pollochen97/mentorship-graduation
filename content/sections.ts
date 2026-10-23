// Content for the chapters built on SectionPage (#11): audition, welcome, monthly meetings 1–4, meetups.
// The shape is in content/types.ts; the values belong to #7.
// Photos are imported rather than linked so the build knows each one's size; SectionPage lays them out
// in rows by that shape, never cropping them, so any number and any mix of portrait and landscape works.
// TODO(#7): the audition steps and the meetups date are still sample copy; photo alt texts are
// placeholders too.
import audition_01 from "@/public/photos/audition/01.jpg";
import audition_02 from "@/public/photos/audition/02.jpg";
import audition_03 from "@/public/photos/audition/03.jpg";
import audition_04 from "@/public/photos/audition/04.jpg";
import welcome_01 from "@/public/photos/welcome/01.jpg";
import welcome_02 from "@/public/photos/welcome/02.jpg";
import welcome_03 from "@/public/photos/welcome/03.jpg";
import welcome_04 from "@/public/photos/welcome/04.jpg";
import m1_01 from "@/public/photos/m1/01.jpg";
import m1_02 from "@/public/photos/m1/02.jpg";
import m1_03 from "@/public/photos/m1/03.jpg";
import m1_04 from "@/public/photos/m1/04.jpg";
import m1_05 from "@/public/photos/m1/05.jpg";
import m1_06 from "@/public/photos/m1/06.jpg";
import m2_01 from "@/public/photos/m2/01.jpg";
import m2_02 from "@/public/photos/m2/02.jpg";
import m2_03 from "@/public/photos/m2/03.jpg";
import m2_04 from "@/public/photos/m2/04.jpg";
import m2_05 from "@/public/photos/m2/05.jpg";
import m3_01 from "@/public/photos/m3/01.jpg";
import m3_02 from "@/public/photos/m3/02.jpg";
import m3_03 from "@/public/photos/m3/03.jpg";
import m3_04 from "@/public/photos/m3/04.jpg";
import m3_05 from "@/public/photos/m3/05.jpg";
import m4_01 from "@/public/photos/m4/01.jpg";
import m4_02 from "@/public/photos/m4/02.jpg";
import m4_03 from "@/public/photos/m4/03.jpg";
import m4_04 from "@/public/photos/m4/04.jpg";
import m4_05 from "@/public/photos/m4/05.jpg";
import m4_06 from "@/public/photos/m4/06.jpg";
import meetups_01 from "@/public/photos/meetups/01.jpg";
import meetups_02 from "@/public/photos/meetups/02.jpg";
import meetups_03 from "@/public/photos/meetups/03.jpg";
import meetups_04 from "@/public/photos/meetups/04.jpg";
import meetups_05 from "@/public/photos/meetups/05.jpg";
import meetups_06 from "@/public/photos/meetups/06.jpg";
import type { Section, SectionKey } from "./types";

export const SECTIONS: Record<SectionKey, Section> = {
  audition: {
    tag: "AUDITION",
    title: "海選",
    date: "2026.05.09",
    text: "緊張的分組討論，才發現大家都好厲害。第一天結束，手機裡已經多了好多 IG 和 LinkedIn。",
    accent: "yellow",
    photos: [
      { src: audition_01, alt: "海選 1" },
      { src: audition_02, alt: "海選 2" },
      { src: audition_03, alt: "海選 3" },
      { src: audition_04, alt: "海選 4" },
    ],
    steps: ["線上報名", "書面審查", "面試", "錄取通知"],
  },
  welcome: {
    tag: "WELCOME",
    title: "相見歡",
    date: "2026.06.13",
    text: "從三個情境找出我的故事開始破冰！有人很愛上班爬牆、有人行李買錯托運、還有人只去神奇的國家（剛從蒙古回來？！）",
    accent: "pink",
    photos: [
      { src: welcome_01, alt: "相見歡 1" },
      { src: welcome_02, alt: "相見歡 2" },
      { src: welcome_03, alt: "相見歡 3" },
      { src: welcome_04, alt: "相見歡 4" },
    ],
  },
  m1: {
    tag: "卓越軟體工程師的知識管理與 AI 賦能",
    title: "第一次月會",
    date: "2026.06.28",
    outline: ["軟體工程師專業核心能力", "學習的認知科學、工具，以及 AI 輔助學習", "學習經驗分享"],
    accent: "blue",
    photos: [
      { src: m1_01, alt: "第一次月會 1" },
      { src: m1_02, alt: "第一次月會 2" },
      { src: m1_03, alt: "第一次月會 3" },
      { src: m1_04, alt: "第一次月會 4" },
      { src: m1_05, alt: "第一次月會 5" },
      { src: m1_06, alt: "第一次月會 6" },
    ],
  },
  m2: {
    tag: "現代軟體工程範式：測試驅動與 AI 協同開發",
    title: "第二次月會",
    date: "2026.07.26",
    outline: ["開發者的測試思維", "AI 本位開發思維：Agentic Development & AI in SDLC"],
    accent: "mint",
    photos: [
      { src: m2_01, alt: "第二次月會 1" },
      { src: m2_02, alt: "第二次月會 2" },
      { src: m2_03, alt: "第二次月會 3" },
      { src: m2_04, alt: "第二次月會 4" },
      { src: m2_05, alt: "第二次月會 5" },
    ],
  },
  m3: {
    tag: "ENG x PM 跨職能協作工作坊",
    title: "第三次月會",
    date: "2026.08.30",
    outline: ["船長對談", "跨職能協作工作坊"],
    accent: "yellow",
    photos: [
      { src: m3_01, alt: "第三次月會 1" },
      { src: m3_02, alt: "第三次月會 2" },
      { src: m3_03, alt: "第三次月會 3" },
      { src: m3_04, alt: "第三次月會 4" },
      { src: m3_05, alt: "第三次月會 5" },
    ],
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
    photos: [
      { src: m4_01, alt: "第四次月會 1" },
      { src: m4_02, alt: "第四次月會 2" },
      { src: m4_03, alt: "第四次月會 3" },
      { src: m4_04, alt: "第四次月會 4" },
      { src: m4_05, alt: "第四次月會 5" },
      { src: m4_06, alt: "第四次月會 6" },
    ],
  },
  meetups: {
    tag: "MEETUPS",
    title: "各種小聚",
    date: "2026.07 — 10",
    text: "月會後的聚餐、一起 co-working、一起去聽 COSCUP。月會之外，這些才是大家真正變熟的時候。",
    accent: "pink",
    photos: [
      { src: meetups_01, alt: "各種小聚 1" },
      { src: meetups_02, alt: "各種小聚 2" },
      { src: meetups_03, alt: "各種小聚 3" },
      { src: meetups_04, alt: "各種小聚 4" },
      { src: meetups_05, alt: "各種小聚 5" },
      { src: meetups_06, alt: "各種小聚 6" },
    ],
  },
};

export function isSectionKey(key: string): key is SectionKey {
  return Object.hasOwn(SECTIONS, key);
}
