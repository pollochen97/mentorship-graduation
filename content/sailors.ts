// The 24 crew members for the 水手介紹 pages (#10): 4 航海士 first, then 20 水手.
// TODO(#6): fill in the names marked 待提供; add mottos, and photos and LinkedIn only for crew
// members who agreed to make them public.
import type { Sailor } from "./types";

const NAVIGATORS = ["Otto", "Aaron", "Fane", "待提供"];

const SAILOR_NAMES = [
  "Celine",
  "Jessy",
  "琪雯",
  "文凱",
  "pei hsuan",
  "Ray",
  "Serene",
  "Will",
  "Wynn",
  "KK",
  "Jason",
  "Katlyn",
  "Kelly",
  "Alson",
  "Ben",
  "小馮",
  "待提供",
  "待提供",
  "待提供",
  "待提供",
];

// Ids follow the list order and must not change once assigned: they pick the illustrated avatar.
export const SAILORS: Sailor[] = [
  ...NAVIGATORS.map((name) => ({ rank: "航海士" as const, name })),
  ...SAILOR_NAMES.map((name) => ({ rank: "水手" as const, name })),
].map((sailor, i) => ({ id: `s${String(i + 1).padStart(2, "0")}`, ...sailor }));
