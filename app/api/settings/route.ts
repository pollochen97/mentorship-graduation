// GET /api/settings → Settings (spec 5.3): the danmaku switch and the group photo URL. Read once by
// every book page; the projector then follows settings:update and photo:final.
import { connection } from "next/server";
import { errorResponse } from "@/lib/http";
import { readSettings } from "./read";

export async function GET() {
  await connection(); // never prerender: the switch and the photo change during the event
  const settings = await readSettings();
  return settings ? Response.json(settings) : errorResponse("server_error");
}
