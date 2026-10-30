// The 22 學員 for the 學員介紹 pages (#10): 4 航海士 first, then 18 水手.
// TODO(#6): add mottos, and LinkedIn only for crew members who agreed to make it public.
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

// Ids follow the list order and must not change once assigned: they pick the illustrated avatar.
export const SAILORS: Sailor[] = [
  ...NAVIGATORS.map((name) => ({ rank: "航海士" as const, name })),
  ...SAILOR_NAMES.map((name) => ({ rank: "水手" as const, name })),
].map((sailor, i) => ({
  id: `s${String(i + 1).padStart(2, "0")}`,
  ...sailor,
  photo: PHOTOS[sailor.name],
}));
