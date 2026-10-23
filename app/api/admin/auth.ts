// The admin session (#19, spec 3.4): log in with ADMIN_PASSWORD, get a signed `admin` cookie, and every
// admin API checks it. Also for #20's final-photo route:
//
//   const denied = requireAdmin(request);
//   if (denied) return denied;
import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/http";

export const ADMIN_COOKIE = "admin";
const MAX_AGE_S = 12 * 60 * 60;

/**
 * The cookie value: `<expires>.<HMAC-SHA256 of expires, keyed by ADMIN_PASSWORD>`. The expiry is
 * signed, so a copied cookie stops working after 12 hours, and a new password logs everyone out.
 */
function sign(secret: string, expires: number) {
  return createHmac("sha256", secret).update(`admin:${expires}`).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Whether an `admin` cookie value is valid for `secret` and not expired. Exported for tests. */
export function verifyAdminCookie(value: string | undefined, secret: string, now = Date.now()) {
  const [expiresText, signature, ...rest] = value?.split(".") ?? [];
  if (!expiresText || !signature || rest.length > 0 || !/^\d+$/.test(expiresText)) return false;
  const expires = Number(expiresText);
  if (expires * 1000 <= now) return false;
  return safeEqual(signature, sign(secret, expires));
}

/** Compares hashes, so the check takes as long whatever the length of the guess. */
export function checkPassword(guess: string) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;
  const hash = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(hash(guess), hash(secret));
}

const cookieOptions = {
  httpOnly: true,
  // Same as the screen and cid cookies: some browsers drop Secure cookies on http://localhost.
  secure: process.env.NODE_ENV === "production",
  // Strict: no other site can make the browser send it, so the admin APIs need no CSRF token.
  sameSite: "strict",
  path: "/",
} as const;

export function setAdminCookie(response: NextResponse) {
  const secret = process.env.ADMIN_PASSWORD!;
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE_S;
  response.cookies.set(ADMIN_COOKIE, `${expires}.${sign(secret, expires)}`, {
    ...cookieOptions,
    maxAge: MAX_AGE_S,
  });
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}

function isValid(value: string | undefined) {
  const secret = process.env.ADMIN_PASSWORD;
  return !!secret && verifyAdminCookie(value, secret);
}

/** In an admin API route: null when the session is valid, otherwise a 401 to return. */
export function requireAdmin(request: NextRequest) {
  return isValid(request.cookies.get(ADMIN_COOKIE)?.value) ? null : errorResponse("unauthorized");
}

/**
 * On the admin page: whether this request is logged in. Reads cookies(), so with Cache Components
 * the caller must sit inside a <Suspense> boundary.
 */
export async function isAdmin() {
  return isValid((await cookies()).get(ADMIN_COOKIE)?.value);
}
