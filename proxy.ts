// Runs before every page (#17; Next.js 16 renamed middleware to proxy). Two independent jobs:
// - the projector's `?key=` → `screen` cookie and a redirect without the key (#34, spec 3.5)
// - a signed `cid` cookie for everyone who doesn't have a valid one yet (spec 6.1)
// Neither blocks anything: without a key or cookie the book, guestbook and /danmaku still load.
import { NextResponse, type NextRequest } from "next/server";
import { ensureCid } from "@/lib/ratelimit";
import { handleScreenKey } from "@/lib/screen-gate";

export function proxy(request: NextRequest) {
  const response = handleScreenKey(request) ?? NextResponse.next();
  ensureCid(request, response);
  return response;
}

export const config = {
  // Pages only: API routes verify the cookie instead of being handed a fresh one, and static files,
  // images and photos (anything with an extension) need neither.
  matcher: ["/((?!api/|_next/static|_next/image|.*\\.\\w+$).*)"],
};
