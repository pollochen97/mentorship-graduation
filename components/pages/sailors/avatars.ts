// Plain TypeScript (no React, no "@/" paths) so npm test can run avatars.test.ts on it directly.
import { ACCENTS, type Accent } from "../../ui/tones.ts";

/** Sea motifs for sailors without a photo (spec 4.1). */
export const AVATAR_ICONS = ["boat", "anchor", "gull", "lighthouse", "wheel", "compass"] as const;
export type AvatarIcon = (typeof AVATAR_ICONS)[number];

/** A number from the id: its digits ("s07" → 7), or a hash when it has none. */
function numberOf(id: string) {
  const digits = /\d+/.exec(id);
  if (digits) return Number(digits[0]);
  return [...id].reduce((h, c) => (h * 31 + c.codePointAt(0)!) >>> 0, 0);
}

/**
 * The illustrated avatar for a sailor, picked from the id alone so it never changes between visits.
 * Consecutive ids always differ in both icon and colour, and any 12 in a row (one page) are all different.
 */
export function avatarOf(id: string): { icon: AvatarIcon; tone: Accent } {
  const n = numberOf(id);
  return { icon: AVATAR_ICONS[n % AVATAR_ICONS.length], tone: ACCENTS[n % ACCENTS.length] };
}
