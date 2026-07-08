import type { Env } from "../../types";
import { handle, success } from "../../_lib/http";

// GET /api/debug/geocode?query=... — temporary diagnostic for the Naver
// geocoding setup. Reports whether creds are present and what each NCP host
// returns, without leaking the secret. Remove once map markers work.
const HOSTS = [
  "https://maps.apigw.ntruss.com/map-geocode/v2/geocode",
  "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode",
];

export const onRequestGet: PagesFunction<Env> = ({ env, request }) =>
  handle(async () => {
    const id = env.NAVER_MAP_CLIENT_ID;
    const secret = env.NAVER_MAP_CLIENT_SECRET;
    const query =
      new URL(request.url).searchParams.get("query")?.trim() || "서울특별시청";

    const out = {
      hasClientId: Boolean(id),
      hasClientSecret: Boolean(secret),
      query,
      attempts: [] as unknown[],
    };

    if (!id || !secret) return success(out);

    for (const host of HOSTS) {
      try {
        const res = await fetch(`${host}?query=${encodeURIComponent(query)}`, {
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
          parsed = text.slice(0, 300);
        }
        const addresses =
          parsed && typeof parsed === "object" && "addresses" in parsed
            ? (parsed as { addresses?: { x: string; y: string }[] }).addresses
            : undefined;
        out.attempts.push({
          host,
          status: res.status,
          ok: res.ok,
          count: addresses?.length ?? 0,
          first: addresses?.[0]
            ? { x: addresses[0].x, y: addresses[0].y }
            : null,
          errorBody: res.ok ? undefined : parsed,
        });
        if (res.ok) break;
      } catch (err) {
        out.attempts.push({
          host,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return success(out);
  });
