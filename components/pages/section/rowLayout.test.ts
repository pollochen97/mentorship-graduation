// npm test. Node runs this TypeScript directly (type stripping), so it imports with the .ts extension.
import assert from "node:assert/strict";
import { test } from "node:test";
import { photoRows } from "./rowLayout.ts";

const H = 4 / 3; // landscape
const V = 3 / 4; // portrait
const shape = (rows: { items: number[] }[]) => rows.map((row) => row.items.length);

/** Every row fits the box and no photo is left out or repeated. */
function assertFits(ratios: number[], w: number, h: number, gap: number) {
  const rows = photoRows(ratios, w, h, gap);
  assert.deepEqual(
    rows.flatMap((row) => row.items),
    ratios.map((_, i) => i),
  );
  for (const row of rows) {
    const width = row.items.reduce((total, i) => total + ratios[i] * row.height, 0);
    assert.ok(width + gap * (row.items.length - 1) <= w + 0.01, "row too wide");
  }
  const height = rows.reduce((total, row) => total + row.height, 0);
  assert.ok(height + gap * (rows.length - 1) <= h + 0.01, "rows too tall");
  return rows;
}

test("photoRows: fits the box for any mix of photos", () => {
  for (const ratios of [[H], [V], [H, H], [V, V], [H, V, H], [H, H, H, H], [V, H, V, H, V, H]]) {
    for (const [w, h] of [
      [900, 720],
      [900, 560],
      [400, 900],
    ]) {
      assertFits(ratios, w, h, 16);
    }
  }
});

test("photoRows: three landscape photos go one above two", () => {
  assert.deepEqual(shape(assertFits([H, H, H], 900, 720, 16)), [1, 2]);
});

test("photoRows: two portrait photos sit side by side", () => {
  assert.deepEqual(shape(assertFits([V, V], 900, 720, 16)), [2]);
});

test("photoRows: six landscape photos make even rows, not one big over five small", () => {
  assert.deepEqual(shape(assertFits([H, H, H, H, H, H], 900, 720, 16)), [2, 2, 2]);
});

test("photoRows: no photos, no rows", () => {
  assert.deepEqual(photoRows([], 900, 720, 16), []);
});
