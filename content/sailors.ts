// The 24 sailors for the 水手介紹 pages (#10).
// TODO(#6): sample data. Replace with the real names; add photos and LinkedIn only for sailors who
// agreed to make them public. Some samples leave fields out on purpose, to show how empty fields look.
import type { Sailor } from "./types";

export const SAILORS: Sailor[] = Array.from({ length: 24 }, (_, i) => {
  const no = String(i + 1).padStart(2, "0");
  return {
    id: `s${no}`,
    name: `水手 ${no}`,
    ...(i % 2 === 0 && { motto: "先求有，再求好，最後求準時下班。" }),
    ...(i % 3 === 0 && { linkedin: "https://www.linkedin.com/" }),
  };
});
