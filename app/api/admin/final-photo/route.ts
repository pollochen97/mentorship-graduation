// The final group photo (#20, spec 3.3). The phone uploads straight to Storage, so the photo never
// passes through a serverless function (their request bodies are capped at a few MB):
//   POST → { path, signedUrl }: a fresh file name and a signed upload URL for it
//   the browser PUTs the JPEG to signedUrl
//   PUT { path } → Settings: checks the file is there, saves its public URL in settings and sends
//   photo:final, so the projector swaps the photo in at once
// DELETE → Settings (#64): back to no photo, e.g. after the rehearsal's test upload. Sends
// settings:update, so the projector shows "waiting for the photo" again. The files stay in Storage.
import { randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { errorResponse, readJson } from "@/lib/http";
import { broadcast } from "@/lib/supabase/broadcast";
import { supabaseAdmin } from "@/lib/supabase/server";
import { readSettings } from "../../settings/read";
import { requireAdmin } from "../auth";
import { FinishInput } from "./schemas";

/** Public bucket from supabase/migrations (#5): JPEG, PNG or WebP, at most 10 MB. */
const BUCKET = "final-photo";

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  // A new name every time, so browsers and the CDN never show an older photo from cache.
  const path = `final-${Date.now()}-${randomBytes(4).toString("hex")}.jpg`;
  const { data, error } = await supabaseAdmin().storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) {
    console.error("[POST /api/admin/final-photo]", error.message);
    return errorResponse("server_error");
  }
  return Response.json({ path: data.path, signedUrl: data.signedUrl });
}

export async function PUT(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const input = await readJson(request, FinishInput);
  if (!input.ok) return input.response;
  const { path } = input.data;

  const storage = supabaseAdmin().storage.from(BUCKET);
  // exists() answers false for a missing file and throws for anything else (Storage down, etc.).
  let exists: boolean;
  try {
    exists = (await storage.exists(path)).data;
  } catch (error) {
    console.error("[PUT /api/admin/final-photo] exists", error);
    return errorResponse("server_error");
  }
  if (!exists) return errorResponse("not_found", "找不到上傳的照片，請重新上傳");

  const url = storage.getPublicUrl(path).data.publicUrl;
  const { error } = await supabaseAdmin()
    .from("settings")
    .upsert({ key: "final_photo_url", value: url });
  if (error) {
    console.error("[PUT /api/admin/final-photo]", error.message);
    return errorResponse("server_error");
  }
  await broadcast("photo:final", { url });

  const settings = await readSettings();
  return settings ? Response.json(settings) : errorResponse("server_error");
}

export async function DELETE(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  // Removing the row is "no photo" to toSettings(); the next upload's upsert adds it back. (Writing a
  // null value would arrive as SQL NULL, which the column refuses, not as the jsonb null it seeds.)
  const { error } = await supabaseAdmin().from("settings").delete().eq("key", "final_photo_url");
  if (error) {
    console.error("[DELETE /api/admin/final-photo]", error.message);
    return errorResponse("server_error");
  }
  // photo:final always carries a photo, so clearing goes out as settings:update, which replaces
  // the projector's settings.
  const settings = await readSettings();
  if (!settings) return errorResponse("server_error");
  await broadcast("settings:update", settings);
  return Response.json(settings);
}
