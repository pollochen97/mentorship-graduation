// Archive mode (spec 3.6) must not reach Supabase through the API while its variables are still set,
// so every route handler starts with archivedResponse() (lib/http.ts). This fails for a new route
// that forgets it. The route files are parsed with the TypeScript compiler, so any way of exporting a
// handler counts: `export async function GET`, `export const GET = async () => {}`, a signature over
// several lines, or `export { handler as GET }`.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const API = fileURLToPath(new URL("../../app/api", import.meta.url));
const METHODS = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);
const GUARD = ["const archived = archivedResponse();", "if (archived) return archived;"];

function routeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return routeFiles(path);
    return entry.name === "route.ts" ? [path] : [];
  });
}

const isExported = (node: ts.Node) =>
  ts.canHaveModifiers(node) &&
  !!ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

type Handler = { method: string; body: ts.Block | null };

/** Every exported HTTP method handler in a route file, with its body (null when it isn't a plain function). */
function handlersOf(source: ts.SourceFile): Handler[] {
  const found: Handler[] = [];
  for (const node of source.statements) {
    if (ts.isFunctionDeclaration(node) && isExported(node) && node.name) {
      if (METHODS.has(node.name.text))
        found.push({ method: node.name.text, body: node.body ?? null });
    } else if (ts.isVariableStatement(node) && isExported(node)) {
      for (const decl of node.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name) || !METHODS.has(decl.name.text)) continue;
        const init = decl.initializer;
        const fn =
          init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) ? init : null;
        found.push({ method: decl.name.text, body: fn && ts.isBlock(fn.body) ? fn.body : null });
      }
    } else if (
      ts.isExportDeclaration(node) &&
      node.exportClause &&
      ts.isNamedExports(node.exportClause)
    ) {
      // `export { handler as GET }`: can't be checked here, so it has to be written as a function.
      for (const spec of node.exportClause.elements) {
        if (METHODS.has(spec.name.text)) found.push({ method: spec.name.text, body: null });
      }
    }
  }
  return found;
}

function check(file: string, text: string) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const handlers = handlersOf(source);
  for (const { method, body } of handlers) {
    assert.ok(
      body,
      `${file} ${method}: write it as a function with a body, so the guard can be checked`,
    );
    const first = body.statements.slice(0, 2).map((s) => s.getText(source).replace(/\s+/g, " "));
    assert.deepEqual(first, GUARD, `${file} ${method} must start with archivedResponse()`);
  }
  return handlers.length;
}

test("every API handler answers archivedResponse() first", () => {
  const files = routeFiles(API);
  assert.ok(files.length > 0, "no route.ts found under app/api");
  for (const file of files) {
    assert.ok(check(file, readFileSync(file, "utf8")) > 0, `${file} exports no handler`);
  }
});

test("the check sees every way of writing a handler", () => {
  const guarded = "const archived = archivedResponse();\n  if (archived) return archived;";
  // Guarded handlers pass, however they are declared.
  for (const text of [
    `export async function GET() {\n  ${guarded}\n}`,
    `export async function PATCH(\n  request: Request,\n  ctx: { params: Promise<{ id: string }> },\n) {\n  ${guarded}\n}`,
    `export const POST = async (request: Request) => {\n  ${guarded}\n};`,
  ]) {
    assert.equal(check("ok.ts", text), 1);
  }
  // Unguarded ones fail, including the forms a regex would miss.
  for (const text of [
    "export async function GET() {\n  return Response.json({});\n}",
    "export async function PATCH(\n  request: Request,\n) {\n  return Response.json({});\n}",
    "export const POST = async () => Response.json({});",
    "export const PUT = async () => {\n  return Response.json({});\n};",
    "async function handler() {}\nexport { handler as DELETE };",
  ]) {
    assert.throws(() => check("bad.ts", text), assert.AssertionError, text);
  }
});
