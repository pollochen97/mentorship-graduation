// Page registry: one line per chapter, in book order. Written once by #3; page issues only edit their
// own component file. Changing this list is a contract change (open a PR labelled `contract`).
import { Cover } from "@/components/pages/Cover";
import { Final } from "@/components/pages/Final";
import { GroupPhoto } from "@/components/pages/GroupPhoto";
import { Sailors } from "@/components/pages/Sailors";
import { SectionPage } from "@/components/pages/SectionPage";
import { Staff, STAFF_PAGES } from "@/components/pages/Staff";
import type { Chapter } from "./types";

export const CHAPTERS: Chapter[] = [
  { key: "cover", label: "封面", component: Cover },
  { key: "staff", label: "工作人員", component: Staff, pageCount: STAFF_PAGES },
  { key: "sailors", label: "學員介紹", component: Sailors, pageCount: 2 },
  { key: "audition", label: "海選", component: SectionPage },
  { key: "welcome", label: "相見歡", component: SectionPage },
  { key: "m1", label: "第一次月會", component: SectionPage, guestbook: "m1" },
  { key: "m2", label: "第二次月會", component: SectionPage, guestbook: "m2" },
  { key: "m3", label: "第三次月會", component: SectionPage, guestbook: "m3" },
  { key: "final", label: "第四次月會 Final", component: Final, guestbook: "m4" },
  { key: "meetups", label: "各種小聚", component: SectionPage },
  { key: "group-photo", label: "大合照", component: GroupPhoto },
];
