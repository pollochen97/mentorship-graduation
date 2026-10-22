// Who is posting, for the rate limits (#17, spec 6.1–6.2). The limits themselves are counted in
// Postgres (post_danmaku / post_note); this file supplies the ids they count by:
// - `cid`: an anonymous id in a signed cookie that proxy.ts hands out on the first page visit. Everyone
//   at the venue shares one Wi-Fi, so the per-person limits can't go by IP.
// - an IP hash, for the loose per-IP limit that catches someone who keeps clearing the cookie.
import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import type { ErrorCode } from "./schemas";

export const CID_COOKIE = "cid";
const MAX_AGE_S = 30 * 24 * 60 * 60;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** The cookie value: `<random UUID>.<HMAC-SHA256 of it, keyed by CID_SECRET>`. */
function sign(secret: string, id: string) {
  return createHmac("sha256", secret).update(`cid:${id}`).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** The id in a `cid` cookie value, or null if it is missing or not signed with `secret`. Exported for tests. */
export function verifyCid(value: string | undefined, secret: string) {
  const [id, signature, ...rest] = value?.split(".") ?? [];
  if (!id || !signature || rest.length > 0 || !UUID.test(id)) return null;
  return safeEqual(signature, sign(secret, id)) ? id : null;
}

/**
 * For proxy.ts: sets a new `cid` cookie on `response` unless the request already carries a valid one.
 * Without CID_SECRET it does nothing (mock-mode development); the API reports the missing secret.
 */
export function ensureCid(request: NextRequest, response: NextResponse) {
  const secret = process.env.CID_SECRET;
  if (!secret || verifyCid(request.cookies.get(CID_COOKIE)?.value, secret)) return;
  const id = randomUUID();
  response.cookies.set(CID_COOKIE, `${id}.${sign(secret, id)}`, {
    httpOnly: true,
    // Same as the screen cookie: some browsers drop Secure cookies on http://localhost.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

/**
 * In an API route: the poster's verified client id and IP hash. Fails with `unauthorized` when the
 * cookie is missing or its signature is wrong (the page tells them to reload, which gets a new one).
 *
 *   const poster = readPoster(request);
 *   if (!poster.ok) return errorResponse(poster.code);
 */
export function readPoster(
  request: NextRequest,
):
  | { ok: true; clientId: string; ipHash: string }
  | { ok: false; code: Extract<ErrorCode, "unauthorized" | "server_error"> } {
  const secret = process.env.CID_SECRET;
  if (!secret) {
    console.error("[ratelimit] CID_SECRET is not set");
    return { ok: false, code: "server_error" };
  }
  const clientId = verifyCid(request.cookies.get(CID_COOKIE)?.value, secret);
  if (!clientId) return { ok: false, code: "unauthorized" };
  // Vercel sets x-forwarded-for itself, so its first entry is the client. Keyed with the secret so the
  // stored hash can't be reversed by hashing every IPv4 address.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = createHmac("sha256", secret).update(`ip:${ip}`).digest("hex").slice(0, 32);
  return { ok: true, clientId, ipHash };
}
