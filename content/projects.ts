// The six final projects for the 第四次月會 page (#12).
// TODO(#7): sample data. Replace with the real names, images and the URLs the QR codes point to.
import type { Project } from "./types";

export const PROJECTS: Project[] = ["A", "B", "C", "D", "E", "F"].map((letter, i) => ({
  id: `p${i + 1}`,
  name: `專案 ${letter}`,
  team: `第 ${i + 1} 組`,
  url: "https://example.com/",
}));
