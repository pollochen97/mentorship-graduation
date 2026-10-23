// Projector identification (#34, spec 3.5). Anyone can read the book and leave notes; only the
// projector subscribes to Realtime and shows the danmaku layer, so the free plan's connections go to
// the 1–2 screens that need them. The projector opens /?key=<SCREEN_KEY> once and gets a `screen`
// cookie; the server checks it and tells the book whether it is on the projector.
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection, NextResponse, type NextRequest } from "next/server";
import { USE_MOCK } from "./mock";

export const SCREEN_COOKIE = "screen";
const MAX_AGE_S = 48 * 60 * 60;

/**
 * The cookie value: `<expires>.<HMAC-SHA256 of expires, keyed by SCREEN_KEY>`. The expiry is signed
 * too, so a copied value stops working after 48 hours even if a browser keeps sending it, and a new
 * SCREEN_KEY invalidates every cookie signed with the old one.
 */
function sign(secret: string, expires: number) {
  return createHmac("sha256", secret).update(`screen:${expires}`).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Whether a `screen` cookie value is valid for `secret` and not expired. Exported for tests. */
export function verifyScreenCookie(value: string | undefined, secret: string, now = Date.now()) {
  const [expiresText, signature, ...rest] = value?.split(".") ?? [];
  if (!expiresText || !signature || rest.length > 0 || !/^\d+$/.test(expiresText)) return false;
  const expires = Number(expiresText);
  if (expires * 1000 <= now) return false;
  return safeEqual(signature, sign(secret, expires));
}

/**
 * For proxy.ts (#17). When the URL carries the right `?key=`, answers with a redirect to the same URL
 * without the key and sets the `screen` cookie; otherwise returns null and the request carries on.
 * A wrong key is ignored, so it neither grants anything nor reveals that the key was wrong.
 *
 *   const screen = handleScreenKey(request);
 *   if (screen) return screen;
 */
export function handleScreenKey(request: NextRequest): NextResponse | null {
  const key = request.nextUrl.searchParams.get("key");
  const secret = process.env.SCREEN_KEY;
  if (key === null || !secret || !safeEqual(key, secret)) return null;

  const url = request.nextUrl.clone();
  url.searchParams.delete("key");
  const response = NextResponse.redirect(url);
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE_S;
  response.cookies.set(SCREEN_COOKIE, `${expires}.${sign(secret, expires)}`, {
    httpOnly: true,
    // Browsers accept Secure cookies on http://localhost, but some don't; keep dev simple.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_S,
  });
  return response;
}

/**
 * On the server: whether this request comes from the projector. Mock mode always says yes, so the
 * danmaku layer can be built locally without a key; without SCREEN_KEY it always says no.
 * Reads cookies(), so with Cache Components the caller must sit inside a <Suspense> boundary.
 */
export async function isProjector() {
  if (USE_MOCK) return true;
  const secret = process.env.SCREEN_KEY;
  if (!secret) return false;
  // The expiry check calls Date.now(), which prerendering (and runtime prefetch) can't use.
  await connection();
  return verifyScreenCookie((await cookies()).get(SCREEN_COOKIE)?.value, secret);
}
