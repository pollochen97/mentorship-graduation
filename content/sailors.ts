// The 22 學員 for the 學員介紹 pages (#10): 4 航海士 first, then 18 水手.
// TODO(#6): add mottos, and photos and LinkedIn only for crew members who agreed to make them public.
import type { Sailor } from "./types";

const NAVIGATORS = ["Otto", "Aaron", "Fane", "Simon"];

const SAILOR_NAMES = [
  "Celine",
  "Jessy",
  "Hannah",
  "Lyon",
  "Jessica",
  "Jui-Hung",
  "Serene",
  "Will",
  "Wynn",
  "KK",
  "Jason",
  "Katlyn",
  "Kelly",
  "Alson",
  "Benjamin",
  "Francis",
  "Ilene",
  "ChengHsuan",
];

// Ids follow the list order and must not change once assigned: they pick the illustrated avatar.
export const SAILORS: Sailor[] = [
  ...NAVIGATORS.map((name) => ({ rank: "航海士" as const, name })),
  ...SAILOR_NAMES.map((name) => ({ rank: "水手" as const, name })),
].map((sailor, i) => ({ id: `s${String(i + 1).padStart(2, "0")}`, ...sailor }));
