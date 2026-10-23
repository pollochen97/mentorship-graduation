// POST /api/admin/login (#19): the password from ADMIN_PASSWORD → the signed admin cookie.
import { NextResponse, type NextRequest } from "next/server";
import { errorResponse, readJson } from "@/lib/http";
import { checkPassword, setAdminCookie } from "../auth";
import { LoginInput } from "../schemas";

/** Slows down guessing; serverless can't count failed attempts in memory. */
const WRONG_PASSWORD_DELAY_MS = 1000;

export async function POST(request: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) {
    console.error("[admin/login] ADMIN_PASSWORD is not set");
    return errorResponse("server_error");
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
