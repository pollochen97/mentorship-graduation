// Content filter for everything visitors post (#17, spec 6.3): normalise the text, then refuse
// profanity and links. Shared by POST /api/danmaku and POST /api/notes.
import { domainToASCII } from "node:url";
import { z } from "zod";
import { TLDS } from "./tlds.ts";

const ZERO_WIDTH = /[​-‍⁠﻿]/g;

/**
 * What gets stored and shown: no zero-width characters, full-width ASCII and the ideographic space
 * turned half-width, runs of whitespace collapsed to one space, trimmed.
 */
export function normalizeText(text: string) {
  return text
    .replace(ZERO_WIDTH, "")
    .replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/\s+/gu, " ")
    .trim();
}

/** A string normalised before a shared schema checks it: `NormalizedText.pipe(DanmakuInput.shape.name)`. */
export const NormalizedText = z.string().transform(normalizeText);

// Matched, lowercase, against the text with whitespace, punctuation and symbols removed, so "幹　" and
// "f.u.c.k" are caught too. Keep entries short; ordinary words that contain one go in ALLOWED.
// 你媽媽的 and friends are listed because ALLOWED has 你媽媽 and 媽媽的, which together would cover them.
const BLOCKED = [
  "幹",
  "操你",
  "肏",
  "屌",
  "姦",
  "婊",
  "靠北",
  "靠杯",
  "靠腰",
  "靠夭",
  "機掰",
  "雞掰",
  "機巴",
  "雞巴",
  "三小",
  "撒小",
  "北七",
  "他媽",
  "她媽",
  "你媽",
  "媽的",
  "你媽媽的",
  "他媽媽的",
  "她媽媽的",
  "賤人",
  "賤貨",
  "白癡",
  "白痴",
  "智障",
  "腦殘",
  "低能",
  "廢物",
  "垃圾人",
  "破麻",
  "去死",
  "王八",
  "畜生",
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "dumbass",
  "cunt",
  "motherf",
  "retard",
  "wtf",
  "stfu",
];

// Ordinary words that contain a blocked entry. A match is let through only where one of these covers
// all of it: 幹部 excuses the 幹 inside it, but in 幹幹部 the first 幹 is still caught.
const ALLOWED = [
  "幹部",
  "幹嘛",
  "幹麻",
  "幹麼",
  "幹啥",
  "幹事",
  "幹活",
  "幹勁",
  "幹練",
  "幹線",
  "幹道",
  "幹得好",
  "能幹",
  "才幹",
  "主幹",
  "骨幹",
  "樹幹",
  "軀幹",
  "苦幹",
  "實幹",
  "精幹",
  "肯幹",
  "大幹",
  "你媽媽",
  "他媽媽",
  "她媽媽",
  "媽媽的",
];

// Links: the scheme or www. even when spaced out; any name ending in a real TLD (example.dev,
// x.y.shop, 例子.台灣), so file names like Next.js and index.html pass; and spaced-out domains
// ("example . com") for common TLDs only, since with spaces removed "Thank you. Love you" would end
// in .love.
const URL_SCHEME = /https?:|www\./;
const ASCII_NAME = /[a-z0-9-]+(?:\.[a-z0-9-]+)+/g;
// Names with other letters too (例子.台灣, 網址.ai). Only "." separates their parts: browsers also
// accept 。, but it ends Chinese sentences, and "畢業快樂。Love you all" isn't a link.
const UNICODE_NAME = /[\p{L}\p{N}\p{M}-]+(?:\.[\p{L}\p{N}\p{M}-]+)+/gu;
const SPACED_DOMAIN = /\.(?:com|net|org|tw|io|cc|me|co|xyz|top|link|ly|gg|app|site|info|biz)\b/;

// Real TLDs that are also common file extensions: let through only as these well-known file names
// (README.md, main.py), never as any name (buy.md, spam.py).
const FILE_TLDS = new Set(["md", "py", "rs", "sh", "java"]);
const FILE_NAMES = new Set([
  ...["readme", "changelog", "contributing", "license", "index", "main", "app", "setup", "manage"],
  ...["lib", "mod", "build", "install", "run", "start"],
]);

/** Whether `text` has a name (matched by `names`) ending in a real TLD that isn't a known file name. */
function hasDomain(text: string, names: RegExp) {
  for (const [name] of text.matchAll(names)) {
    const dot = name.lastIndexOf(".");
    // 台灣 → xn--kpry57d, as TLDS lists it.
    const tld = domainToASCII(name.slice(dot + 1));
    if (!TLDS.has(tld)) continue;
    if (FILE_TLDS.has(tld) && FILE_NAMES.has(name.slice(0, dot))) continue;
    return true;
  }
  return false;
}

/** Whether normalised text contains profanity or a link (spec 6.3, steps 3 and 4). */
export function isForbidden(text: string) {
  // NFKC also folds look-alikes such as 𝐟𝐮𝐜𝐤 and ①, and ．／｡ into . and 。.
  const lower = text.normalize("NFKC").toLowerCase();
  // Browsers accept 。 as a dot in domains; see UNICODE_NAME for why it only counts here.
  const dotted = lower.replaceAll("。", ".");
  const unspaced = dotted.replace(/\s+/gu, "");
  if (
    URL_SCHEME.test(unspaced) ||
    SPACED_DOMAIN.test(unspaced) ||
    hasDomain(dotted, ASCII_NAME) ||
    hasDomain(lower, UNICODE_NAME)
  )
    return true;
  const squashed = lower.replace(/[\s\p{P}\p{S}]/gu, "");
  return BLOCKED.some((word) => {
    for (let i = squashed.indexOf(word); i !== -1; i = squashed.indexOf(word, i + 1)) {
      if (!isAllowedAt(squashed, i, i + word.length)) return true;
    }
    return false;
  });
}

/** Whether an ALLOWED word in `text` spans all of `start`..`end`. */
function isAllowedAt(text: string, start: number, end: number) {
  return ALLOWED.some((word) => {
    for (let j = Math.max(0, end - word.length); j <= start; j++) {
      if (text.startsWith(word, j)) return true;
    }
    return false;
  });
}
