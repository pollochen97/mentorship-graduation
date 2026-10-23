// GET /api/me → Me (#55): the Google account behind `Authorization: Bearer <access token>`, and
// whether it may write notes. The guestbook asks right after sign-in, so someone off the whitelist
// finds out before typing a note rather than when sending it.
import { errorResponse } from "@/lib/http";
import { readMember } from "@/lib/supabase/member";

export async function GET(request: Request) {
  const member = await readMember(request);
  if (!member.ok) return errorResponse(member.code);
  return Response.json({ email: member.email, allowed: member.allowed });
}
