/// <reference types="@cloudflare/workers-types" />

// SPA fallback. This catch-all runs only for paths not handled by a more
// specific Function (e.g. everything under /api/* wins over this). It serves
// the real static asset when one exists, and falls back to index.html for
// client-side routes so deep links / refreshes don't 404.
interface AssetsEnv {
  ASSETS: Fetcher;
}

export const onRequest: PagesFunction<AssetsEnv> = async (context) => {
  const { request, env } = context;
  const assetResponse = await env.ASSETS.fetch(request);

  if (assetResponse.status !== 404) return assetResponse;

  const accepts = request.headers.get("Accept") ?? "";
  if (request.method === "GET" && accepts.includes("text/html")) {
    const url = new URL(request.url);
    return env.ASSETS.fetch(new Request(new URL("/index.html", url), request));
  }
  return assetResponse;
};
