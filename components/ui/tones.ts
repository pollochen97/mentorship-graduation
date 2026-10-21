/** Background colours a component can take; maps to the data-tone rules in app/globals.css. */
export type Tone = "yellow" | "mint" | "pink" | "blue" | "white" | "paper" | "ink";

/** The four accent colours: chapter labels, sticky notes, stat boxes. */
export const ACCENTS = ["yellow", "mint", "pink", "blue"] as const satisfies readonly Tone[];
export type Accent = (typeof ACCENTS)[number];

/** Joins class names, skipping falsy ones. */
export function cx(...names: (string | false | null | undefined)[]) {
  return names.filter(Boolean).join(" ");
}
