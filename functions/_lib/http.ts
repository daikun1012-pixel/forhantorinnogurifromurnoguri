export class HttpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function success(data: unknown, status = 200): Response {
  return Response.json({ ok: true, data }, { status });
}

export function failure(message: string, status = 400): Response {
  return Response.json({ ok: false, error: message }, { status });
}

/** Run a handler, converting thrown HttpErrors into JSON error responses. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof HttpError) return failure(err.message, err.status);
    return failure("Internal error", 500);
  }
}

export async function readJson<T = Record<string, unknown>>(
  request: Request,
): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError("잘못된 요청 형식입니다", 400);
  }
}

export function str(
  obj: Record<string, unknown>,
  key: string,
  { required = true, max = 2000 }: { required?: boolean; max?: number } = {},
): string {
  const v = obj[key];
  if (v === undefined || v === null || v === "") {
    if (required) throw new HttpError(`${key} 값이 필요합니다`, 422);
    return "";
  }
  if (typeof v !== "string") throw new HttpError(`${key} 형식이 올바르지 않습니다`, 422);
  if (v.length > max) throw new HttpError(`${key} 길이가 너무 깁니다`, 422);
  return v.trim();
}

export function bool(obj: Record<string, unknown>, key: string): boolean {
  return obj[key] === true;
}

export function numOrNull(
  obj: Record<string, unknown>,
  key: string,
): number | null {
  const v = obj[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

export function oneOf<T extends string>(
  obj: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
  fallback?: T,
): T {
  const v = obj[key];
  if (typeof v === "string" && allowed.includes(v as T)) return v as T;
  if (fallback !== undefined) return fallback;
  throw new HttpError(`${key} 값이 올바르지 않습니다`, 422);
}
