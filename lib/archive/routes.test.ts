// Archive mode (spec 3.6) must not reach Supabase through the API while its variables are still set,
// so every route handler starts with archivedResponse() (lib/http.ts). This fails for a new route
// that forgets it.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const API = fileURLToPath(new URL("../../app/api", import.meta.url));
const HANDLER =
  /^export (?:async )?function (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b[^\n]*\{\n(.*)$/gm;
const GUARD = "  const archived = archivedResponse();";

function routeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return routeFiles(path);
    return entry.name === "route.ts" ? [path] : [];
  });
}

test("every API handler answers archivedResponse() first", () => {
  const files = routeFiles(API);
  assert.ok(files.length > 0, "no route.ts found under app/api");
  let handlers = 0;
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const [, method, firstLine] of source.matchAll(HANDLER)) {
      handlers++;
      assert.equal(firstLine, GUARD, `${file} ${method} must start with archivedResponse()`);
    }
  }
  assert.ok(handlers >= files.length, "every route.ts exports at least one handler");
});
