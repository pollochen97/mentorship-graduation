// Helpers for API route handlers (#15, #17, #19, #20), so every route answers in the same format.
import type { z } from "zod";
import { ERROR_MESSAGES, ERROR_STATUS, type ErrorCode } from "./schemas";

/** An error response with the shared body `{ error: { code, message, retryAfter? } }`. */
export function errorResponse(
  code: ErrorCode,
  message = ERROR_MESSAGES[code],
  retryAfter?: number,
) {
  const error = retryAfter === undefined ? { code, message } : { code, message, retryAfter };
  return Response.json(
    { error },
    {
      status: ERROR_STATUS[code],
      headers:
        retryAfter === undefined ? undefined : { "Retry-After": String(Math.ceil(retryAfter)) },
    },
  );
}

/** Parses and validates a JSON body; on failure, `response` is a ready 400 to return. */
export async function readJson<S extends z.ZodType>(
  req: Request,
  schema: S,
): Promise<{ ok: true; data: z.infer<S> } | { ok: false; response: Response }> {
  const body: unknown = await req.json().catch(() => undefined);
  const parsed = schema.safeParse(body);
  if (parsed.success) return { ok: true, data: parsed.data };
  const issue = parsed.error.issues[0];
  const message = issue
    ? `${issue.path.join(".")}：${issue.message}`
    : ERROR_MESSAGES.invalid_input;
  return { ok: false, response: errorResponse("invalid_input", message) };
}
