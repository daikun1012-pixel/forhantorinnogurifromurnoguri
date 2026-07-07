/// <reference types="@cloudflare/workers-types" />

/**
 * Environment bindings available to Cloudflare Pages Functions.
 *
 * The D1 database is bound as `DB` (see wrangler.toml) and is accessed at
 * runtime via `env.DB`, e.g.:
 *
 *   export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
 *     const { results } = await env.DB.prepare("SELECT * FROM places").all();
 *     return Response.json(results);
 *   };
 */
export interface Env {
  DB: D1Database;
}
