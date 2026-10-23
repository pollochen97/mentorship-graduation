// npm test. Node runs this TypeScript directly (type stripping), so it imports with the .ts extension.
import assert from "node:assert/strict";
import { test } from "node:test";
import { pagesFor } from "./paging.ts";

test("pagesFor: nine notes a page, the pad has its own corner", () => {
  for (const [notes, pages] of [
    [0, 1],
    [1, 1],
    [8, 1],
    [9, 1],
    [10, 2],
    [18, 2],
    [19, 3],
  ]) {
    assert.equal(pagesFor(notes), pages, `${notes} notes`);
  }
});
