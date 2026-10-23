// Request and response shapes of /api/admin/final-photo (#20), shared by the route and app/admin.
import { z } from "zod";

/** Names the route hands out: final-<ms timestamp>-<8 hex>.jpg. Anything else is refused. */
export const PHOTO_PATH = /^final-\d{13}-[0-9a-f]{8}\.jpg$/;

/** POST → where to PUT the photo; the signed URL works for 2 hours. */
export const UploadTicket = z.object({ path: z.string().regex(PHOTO_PATH), signedUrl: z.url() });
export type UploadTicket = z.infer<typeof UploadTicket>;

/** PUT, once the photo is uploaded. */
export const FinishInput = z.object({ path: z.string().regex(PHOTO_PATH, "照片路徑不正確") });
