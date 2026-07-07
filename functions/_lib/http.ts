// Shared HTTP helpers for API routes.

export function success(data: unknown, status = 200): Response {
  return Response.json({ ok: true, data }, { status });
}

export function error(
  message: string,
  status = 400,
  details?: unknown,
): Response {
  return Response.json({ ok: false, error: message, details }, { status });
}

/** Parse a JSON request body; throws HttpError(400) on invalid JSON. */
export async function readJson<T = Record<string, unknown>>(
  request: Request,
): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError("Invalid JSON body", 400);
  }
}

export class HttpError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status = 400, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Wrap a handler so thrown HttpErrors become clean JSON responses. */
export function handle(
  fn: () => Promise<Response>,
): Promise<Response> {
  return fn().catch((err) => {
    if (err instanceof HttpError) {
      return error(err.message, err.status, err.details);
    }
    return error("Internal error", 500);
  });
}

// --- validation ---------------------------------------------------------

export function requireString(
  obj: Record<string, unknown>,
  key: string,
): string {
  const v = obj[key];
  if (typeof v !== "string" || v.trim() === "") {
    throw new HttpError(`Field "${key}" is required`, 422);
  }
  return v;
}

export function optionalString(
  obj: Record<string, unknown>,
  key: string,
  fallback = "",
): string {
  const v = obj[key];
  return typeof v === "string" ? v : fallback;
}

export function requireNumber(
  obj: Record<string, unknown>,
  key: string,
): number {
  const v = obj[key];
  if (typeof v !== "number" || Number.isNaN(v)) {
    throw new HttpError(`Field "${key}" must be a number`, 422);
  }
  return v;
}

export function requireEnum<T extends string>(
  obj: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
): T {
  const v = obj[key];
  if (typeof v !== "string" || !allowed.includes(v as T)) {
    throw new HttpError(
      `Field "${key}" must be one of: ${allowed.join(", ")}`,
      422,
    );
  }
  return v as T;
}
