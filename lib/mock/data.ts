// Seed data for mock mode. Fake names and messages only.
import type { NoteSection } from "../schemas";

export const MOCK_NAMES = ["小芸", "阿哲", "柏宇", "佳佳", "Ken", "Mina", "水手 07", "水手 12"];

export const MOCK_DANMAKU = [
  "水手們辛苦了！！",
  "船長好帥",
  "+1 +1 +1",
  "我要看大合照！",
  "四個月一下就過了 QQ",
  "下一屆還要來",
  "全體水手 衝衝衝",
  "謝謝工作人員！",
  "完結撒花 🎉",
  "這頁照片好可愛",
];

export const MOCK_NOTES = [
  "謝謝這四個月的陪伴，學到好多！",
  "第一次月會的白板到現在還記得",
  "下次聚餐換我揪 🍻",
  "認識大家真的很開心",
  "軟實力那堂課超有收穫",
  "希望明年還能見到大家",
  "最喜歡月會後的宵夜時間",
  "辛苦工作人員了！",
  "一起加油，繼續航行 ⛵",
];

/** How many notes each guestbook starts with: m2 needs two pages, m3 starts empty. */
export const MOCK_NOTE_COUNTS: Record<NoteSection, number> = { m1: 4, m2: 12, m3: 0, m4: 2 };

/** Words the mock rejects as forbidden_content, so the error state can be tried out. */
export const MOCK_BLOCKED = ["髒話", "幹", "fuck"];
