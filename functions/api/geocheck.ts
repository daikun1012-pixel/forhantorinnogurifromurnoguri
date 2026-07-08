import type { Env } from "../types";
import { handle, success } from "../_lib/http";

// GET /api/geocheck?q=... — top-level geocoding self-test (unauthenticated).
// Same directory depth as /api/health so it routes reliably. Reports NCP
// geocoding status without leaking the secret. Remove once map works.
const HOSTS = [
  "https://maps.apigw.ntruss.com/map-geocode/v2/geocode",
  "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode",
];

export const onRequestGet: PagesFunction<Env> = ({ env, request }) =>
  handle(async () => {
    const id = env.NAVER_MAP_CLIENT_ID;
    const secret = env.NAVER_MAP_CLIENT_SECRET;
    const q =
      new URL(request.url).searchParams.get("q")?.trim() || "서울특별시청";

    const out: Record<string, unknown> = {
      hasClientId: Boolean(id),
      hasClientSecret: Boolean(secret),
      query: q,
      attempts: [] as unknown[],
    };
    const attempts = out.attempts as unknown[];
    if (!id || !secret) return success(out);

    for (const host of HOSTS) {
      try {
        const res = await fetch(`${host}?query=${encodeURIComponent(q)}`, {
          headers: {
            "x-ncp-apigw-api-key-id": id,
            "x-ncp-apigw-api-key": secret,
          },
        });
        const text = await res.text();
        let parsed: unknown = null;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text.slice(0, 200);
        }
        const addresses =
          parsed && typeof parsed === "object" && "addresses" in parsed
            ? (parsed as { addresses?: { x: string; y: string }[] }).addresses
            : undefined;
        attempts.push({
          host: host.includes("maps.apigw") ? "new" : "legacy",
          status: res.status,
          count: addresses?.length ?? 0,
          first: addresses?.[0] ?? null,
          body: res.ok ? undefined : parsed,
        });
        if (res.ok) break;
      } catch (err) {
        attempts.push({
          host: host.includes("maps.apigw") ? "new" : "legacy",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return success(out);
  });
