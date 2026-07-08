import type { Env } from "../types";
import { handle, success } from "../_lib/http";
import { geocodeEnabled } from "../_lib/geocode";

// GET /api/config — public front-end config. Exposes only the public map
// client id (safe to expose) and which script param name to use.
export const onRequestGet: PagesFunction<Env> = ({ env }) =>
  handle(async () => {
    return success({
      naverMapClientId: env.NAVER_MAP_CLIENT_ID ?? "",
      naverMapKeyParam: env.NAVER_MAP_KEY_PARAM || "ncpClientId",
      searchEnabled: Boolean(
        env.NAVER_SEARCH_CLIENT_ID && env.NAVER_SEARCH_CLIENT_SECRET,
      ),
      geocodeEnabled: geocodeEnabled(env),
    });
  });
