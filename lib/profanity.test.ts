// npm test. Node runs this TypeScript directly (type stripping), so it imports with the .ts extension.
import assert from "node:assert/strict";
import { test } from "node:test";
import { isForbidden, normalizeText } from "./profanity.ts";

const check = (text: string) => isForbidden(normalizeText(text));

test("normalizeText", () => {
  assert.equal(normalizeText("ＡＢＣ​"), "ABC");
  assert.equal(normalizeText(" 哈囉　　大家 "), "哈囉 大家");
});

test("blocks profanity, spaced out or disguised", () => {
  for (const text of [
    "幹",
    "幹　你",
    "幹 你 娘",
    "f.u.c.k",
    "F U C K",
    "ｆｕｃｋ",
    "𝐟𝐮𝐜𝐤",
    "靠北喔",
    "你媽的",
    "白癡",
    "shit!",
  ]) {
    assert.equal(check(text), true, text);
  }
});

test("an allowed word only excuses the match it covers", () => {
  for (const text of ["你媽媽的", "你 媽 媽 的", "他媽媽的", "媽的你媽媽", "幹幹部", "能幹 幹"]) {
    assert.equal(check(text), true, text);
  }
});

test("lets ordinary words through", () => {
  for (const text of [
    "幹部辛苦了",
    "幹嘛那麼感動",
    "你真能幹",
    "幹得好！",
    "謝謝你媽媽",
    "其他媽媽們辛苦了",
    "謝謝媽媽的照顧",
    "我媽媽的便當最好吃",
    "操場見",
    "依靠彼此",
    "1987 年",
    "最棒的company",
  ]) {
    assert.equal(check(text), false, text);
  }
});

test("blocks links", () => {
  for (const text of [
    "http://x",
    "https ://x",
    "w w w . x",
    "example.com",
    "example . com",
    "EXAMPLE．TW",
    "看 example.dev",
    "shop.example.store",
    "x.photography/abc",
    "example。shop",
    "example｡xyz",
  ]) {
    assert.equal(check(text), true, text);
  }
});

test("doesn't take sentences or numbers for links", () => {
  for (const text of [
    "Thank you. Love you",
    "Great job. See you",
    "畢業快樂。Love you all",
    "e.g. 這樣",
    "Ph.D",
    "3.5 年",
    "v1.0",
    "ok...yes",
  ]) {
    assert.equal(check(text), false, text);
  }
});
