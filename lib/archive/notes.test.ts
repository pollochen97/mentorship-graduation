import assert from "node:assert/strict";
import { test } from "node:test";
import { archivedNotes } from "./notes.ts";

const note = (id: string, section: string, createdAt: string) => ({
  id,
  section,
  name: "小芸",
  body: "恭喜結業",
  color: 0,
  createdAt,
});

const A = "00000000-0000-4000-8000-00000000000a";
const B = "00000000-0000-4000-8000-00000000000b";
const C = "00000000-0000-4000-8000-00000000000c";

test("one guestbook's notes, oldest first, ties broken by id", () => {
  const file = {
    notes: [
      note(C, "m1", "2026-10-25T10:00:00.000Z"),
      note(B, "m2", "2026-10-24T10:00:00.000Z"),
      note(B, "m1", "2026-10-24T10:00:00.000Z"),
      note(A, "m1", "2026-10-24T10:00:00.000Z"),
    ],
  };
  assert.deepEqual(
    archivedNotes(file, "m1").map((n) => n.id),
    [A, B, C],
  );
  assert.equal(archivedNotes(file, "m3").length, 0);
});

test("rejects a file that doesn't match the Note shape", () => {
  assert.throws(() => archivedNotes({ notes: [{ id: "x" }] }, "m1"));
  assert.throws(() => archivedNotes(null, "m1"));
});
