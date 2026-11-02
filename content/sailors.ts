// The 22 學員 for the 學員介紹 pages (#10): 4 航海士 first, then 18 水手.
// TODO(#6): add the other 14 sailors' lines and links, only if they agreed to make them public.
import type { Sailor } from "./types";

// Both lists A–Z, ignoring case; 戴 and 馮 go by Dai and Feng.
const NAVIGATORS = ["Aaron", "Fane", "Otto", "Simon"];

const SAILOR_NAMES = [
  "Alson",
  "Ben",
  "Celine",
  "戴",
  "馮",
  "Hannah",
  "Ilene",
  "Jason",
  "Jessica",
  "Jessy",
  "Katlyn",
  "Kelly",
  "KK",
  "Lyon",
  "Ray",
  "Serene",
  "Will",
  "Wynn",
];

const PHOTOS: Record<string, string> = {
  Aaron: "/photos/sailors/aaron.jpg",
  Fane: "/photos/sailors/fane.jpg",
  Otto: "/photos/sailors/otto.jpg",
  Simon: "/photos/sailors/simon.jpg",
  Alson: "/photos/sailors/alson.jpg",
  Ben: "/photos/sailors/ben.jpg",
  Celine: "/photos/sailors/celine.jpg",
  戴: "/photos/sailors/dai.jpg",
  馮: "/photos/sailors/feng.jpg",
  Hannah: "/photos/sailors/hannah.jpg",
  Ilene: "/photos/sailors/ilene.jpg",
  Jason: "/photos/sailors/jason.jpg",
  Jessica: "/photos/sailors/jessica.jpg",
  Jessy: "/photos/sailors/jessy.jpg",
  Katlyn: "/photos/sailors/katlyn.jpg",
  Kelly: "/photos/sailors/kelly.jpg",
  KK: "/photos/sailors/kk.jpg",
  Lyon: "/photos/sailors/lyon.jpg",
  Ray: "/photos/sailors/ray.jpg",
  Serene: "/photos/sailors/serene.jpg",
  Will: "/photos/sailors/will.jpg",
  Wynn: "/photos/sailors/wynn.jpg",
};

// What each sailor wants to say and link to, as they filled it in. Links keep only the profile URL.
const PROFILES: Record<string, Pick<Sailor, "motto" | "links">> = {
  Aaron: {
    motto:
      "認識了許許多多不一樣的人，大家的想法碰撞讓我有更多不同的視野及思維，船長的分享更是讓人再三回想，是一個很棒的活動，很高興認識大家。",
    links: [{ label: "LinkedIn", url: "https://www.linkedin.com/in/aaron-shih" }],
  },
  Ben: {
    motto:
      "我是喜歡打電動跟聽故事的Ben，很高興在曼陀號跟很多厲害的人交流，也從中找到職涯努力的方向",
    links: [
      { label: "IG", url: "https://www.instagram.com/bc_jian" },
      {
        label: "LinkedIn",
        url: "https://www.linkedin.com/in/%E9%82%A6%E4%B8%9E-%E7%B0%A1-b3ba97209",
      },
    ],
  },
  Hannah: {
    motto: "Stay curious, keep going 🧚🏻‍♀️",
    links: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/chiwenchen97" },
      { label: "IG", url: "https://www.instagram.com/chiwen97" },
    ],
  },
  Kelly: {
    motto: "人生沒有 Stack Overflow 可以查，只好一邊寫 code，一邊 console.log 自己的人生。",
    links: [{ label: "IG", url: "https://www.instagram.com/yyko_1101" }],
  },
  KK: {
    motto:
      "在 AI 快速發展的時代，參與曼陀號是我做過最正確的決定。期許自己日後能帶著在這裡種下的種子，播撒給更多人，讓它在更遠的地方發芽。",
    links: [{ label: "GitHub", url: "https://github.com/KK-Huang86" }],
  },
  Lyon: {
    motto:
      "參加曼陀號，遇到了一群好純粹的人。大家在這裡交流的都是技術、興趣與人脈。也是有這一群人，我才有膽去參加了第一次的開源 Conference。謝謝曼陀號！",
    links: [
      {
        label: "LinkedIn",
        url: "https://www.linkedin.com/in/%E6%96%87%E5%87%B1-%E5%91%82-0ab807160/",
      },
    ],
  },
  Serene: {
    motto: "Hello 我是 Serene，是個大 J 人？！喜歡吃美食、喝咖啡、抹茶、旅遊、到處走走吃吃喝喝！",
    links: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/serenechao/" },
      { label: "IG", url: "https://www.instagram.com/chao_et/" },
    ],
  },
  Will: {
    motto:
      "很高興能夠參加曼陀號！認識了不少有趣的人，學到很多工作外的知識，完全不虛此行～ 很感謝曼陀號的工作人員們的付出！",
    links: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/wei-chen-chen-199603" },
      { label: "GitHub", url: "https://github.com/Double-T1" },
    ],
  },
};

// Ids follow the list order and must not change once assigned: they pick the illustrated avatar.
export const SAILORS: Sailor[] = [
  ...NAVIGATORS.map((name) => ({ rank: "航海士" as const, name })),
  ...SAILOR_NAMES.map((name) => ({ rank: "水手" as const, name })),
].map((sailor, i) => ({
  id: `s${String(i + 1).padStart(2, "0")}`,
  ...sailor,
  photo: PHOTOS[sailor.name],
  ...PROFILES[sailor.name],
}));
