// POST /api/admin/logout (#19): clears the admin cookie.
import { NextResponse } from "next/server";
import { archivedResponse } from "@/lib/http";
import { clearAdminCookie } from "../auth";

export async function POST() {
  const archived = archivedResponse();
  if (archived) return archived;
  const response = new NextResponse(null, { status: 204 });
  clearAdminCookie(response);
  return response;
}
