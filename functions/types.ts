/// <reference types="@cloudflare/workers-types" />

/** Bindings available to Pages Functions. D1 is bound as `DB`. */
export interface Env {
  DB: D1Database;

  // Naver integration (set as Pages environment variables / secrets).
  // Public map client id (NCP Maps).
  NAVER_MAP_CLIENT_ID?: string;
  // NCP Maps client secret — enables server-side address geocoding.
  NAVER_MAP_CLIENT_SECRET?: string;
  // Script query-param name for the map key: "ncpClientId" (default) or
  // "ncpKeyId" depending on the key type issued by Naver Cloud Platform.
  NAVER_MAP_KEY_PARAM?: string;
  // Local Search API credentials (Naver Developers). Secret.
  NAVER_SEARCH_CLIENT_ID?: string;
  NAVER_SEARCH_CLIENT_SECRET?: string;
}
