// Browser-side calls to /api/admin (#19), answering ApiResult like lib/api.ts. A 401 means the
// session expired: the caller refreshes the page, which shows the login form again.
import type { z } from "zod";
import type { ApiResult } from "@/lib/api";
import { ApiErrorBody, ERROR_MESSAGES, type ErrorCode } from "@/lib/schemas";

const failure = (code: ErrorCode, message = ERROR_MESSAGES[code]) =>
  ({ ok: false, error: { code, message } }) as const;

/** `schema` null: the route answers 204 with no body. */
export async function adminFetch<S extends z.ZodType>(
  path: string,
  schema: S | null,
  { method = "GET", body }: { method?: string; body?: unknown } = {},
): Promise<ApiResult<z.infer<S>>> {
  let res: Response;
  try {
    res = await fetch(`/api/admin${path}`, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return failure("network_error");
  }
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const parsed = ApiErrorBody.safeParse(json);
    if (parsed.success) return { ok: false, error: parsed.data.error };
    return failure(res.status === 401 ? "unauthorized" : "server_error");
  }
  if (!schema) return { ok: true, data: undefined as z.infer<S> };
  const parsed = schema.safeParse(json);
  return parsed.success
    ? { ok: true, data: parsed.data }
    : failure("server_error", "回應格式不正確");
}
