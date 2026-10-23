// Who is writing a guestbook note (#55): a Google sign-in whose address is on the whitelist. The
// browser sends its Supabase access token as `Authorization: Bearer <token>`; this checks it with
// Supabase Auth and looks the address up in allowed_emails.
import "server-only";
import type { ErrorCode } from "../schemas";
import { supabaseAdmin } from "./server";

type Failure = { ok: false; code: Extract<ErrorCode, "unauthorized" | "server_error"> };

/** The Google account behind the request's access token, and whether it is on the whitelist. */
export async function readMember(
  request: Request,
): Promise<{ ok: true; userId: string; email: string; allowed: boolean } | Failure> {
  const token = request.headers.get("authorization")?.match(/^Bearer (\S+)$/)?.[1];
  if (!token) return { ok: false, code: "unauthorized" };

  const db = supabaseAdmin();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return { ok: false, code: "unauthorized" };
  const { user } = data;
  const email = user.email?.toLowerCase();
  // Only an address Google vouched for counts: anyone could sign up elsewhere with someone's address.
  const google = (user.app_metadata.providers as string[] | undefined)?.includes("google");
  if (!email || !google) return { ok: true, userId: user.id, email: email ?? "", allowed: false };

  const listed = await db.from("allowed_emails").select("email").eq("email", email).maybeSingle();
  if (listed.error) {
    console.error("[member]", listed.error.message);
    return { ok: false, code: "server_error" };
  }
  return { ok: true, userId: user.id, email, allowed: listed.data !== null };
}
