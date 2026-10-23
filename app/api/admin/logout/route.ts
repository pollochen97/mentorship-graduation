// POST /api/admin/logout (#19): clears the admin cookie.
import { NextResponse } from "next/server";
import { clearAdminCookie } from "../auth";

export async function POST() {
  const response = new NextResponse(null, { status: 204 });
  clearAdminCookie(response);
  return response;
}
