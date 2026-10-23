// POST /api/admin/login (#19): the password from ADMIN_PASSWORD → the signed admin cookie.
import { NextResponse, type NextRequest } from "next/server";
import { errorResponse, readJson } from "@/lib/http";
import { adminSecret, checkPassword, MIN_PASSWORD_LENGTH, setAdminCookie } from "../auth";
import { LoginInput } from "../schemas";

/**
 * Slows down someone trying passwords one after another. It doesn't stop guesses sent in parallel;
 * the password length does (MIN_PASSWORD_LENGTH).
 */
const WRONG_PASSWORD_DELAY_MS = 1000;

export async function POST(request: NextRequest) {
  if (!adminSecret()) {
    console.error(
      `[admin/login] ADMIN_PASSWORD is missing or shorter than ${MIN_PASSWORD_LENGTH} characters; ` +
        "generate one with `openssl rand -base64 24`",
    );
    return errorResponse("server_error", "後台密碼未設定或太短，請聯絡負責人");
  }
  const input = await readJson(request, LoginInput);
  if (!input.ok) return input.response;
  if (!checkPassword(input.data.password)) {
    await new Promise((resolve) => setTimeout(resolve, WRONG_PASSWORD_DELAY_MS));
    return errorResponse("unauthorized", "密碼錯誤");
  }
  const response = new NextResponse(null, { status: 204 });
  setAdminCookie(response);
  return response;
}
