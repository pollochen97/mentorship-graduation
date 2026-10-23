// npm test. Node runs this TypeScript directly (type stripping), so it imports with the .ts extension.
import assert from "node:assert/strict";
import { test } from "node:test";
import { avatarOf } from "./avatars.ts";

const ids = Array.from({ length: 24 }, (_, i) => `s${String(i + 1).padStart(2, "0")}`);
const key = (id: string) => JSON.stringify(avatarOf(id));

test("avatarOf: the same id always gets the same avatar", () => {
  for (const id of [...ids, "otto", "待提供"]) assert.equal(key(id), key(id));
});

test("avatarOf: no two sailors on a page of 12 share an avatar", () => {
  for (const page of [ids.slice(0, 12), ids.slice(12)]) {
    assert.equal(new Set(page.map(key)).size, page.length);
  }
});
