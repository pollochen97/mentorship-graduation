// Demo content (NEXT_PUBLIC_CONTENT=demo, see next.config.ts): made-up 學員 for the public demo site,
// so it shows nobody's real name, photo or social links. Same shape and count as content/sailors.ts.
import type { Sailor } from "../types";

const NAVIGATORS = ["阿哲", "Ken", "Mina", "柏宇"];

const SAILOR_NAMES = [
  "Amber",
  "阿德",
  "阿凱",
  "佳佳",
  "Ivy",
  "Joyce",
  "Leo",
  "Max",
  "Nora",
  "Owen",
  "Ruby",
  "Tim",
  "Vicky",
  "小晴",
  "小魚",
  "小芸",
  "奕安",
  "宇辰",
];

const PROFILES: Record<string, Pick<Sailor, "motto">> = {
  阿哲: { motto: "四個月前還不太敢在大家面前發問，現在會主動約 code review 了。" },
  Mina: { motto: "最喜歡月會後的聚餐，技術以外的話題也聊得好開心。" },
  佳佳: { motto: "第一次用測試驅動的方式寫完一個功能，原來紅燈變綠燈這麼療癒。" },
  Leo: { motto: "謝謝引水人每次都問「為什麼」，讓我學會先想清楚再動手。" },
  Nora: { motto: "在工作坊認識了 PM 夥伴，才知道需求背後有這麼多取捨。" },
  小魚: { motto: "恭喜結業！一路順風，下一個港口見。" },
  宇辰: { motto: "期許自己把在這裡學到的，繼續分享給更多人。" },
};

// Ids follow the list order, like content/sailors.ts; with no photos they pick the illustrated avatars.
export const SAILORS: Sailor[] = [
  ...NAVIGATORS.map((name) => ({ rank: "航海士" as const, name })),
  ...SAILOR_NAMES.map((name) => ({ rank: "水手" as const, name })),
].map((sailor, i) => ({
  id: `s${String(i + 1).padStart(2, "0")}`,
  ...sailor,
  ...PROFILES[sailor.name],
}));
