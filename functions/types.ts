/// <reference types="@cloudflare/workers-types" />

/** Bindings available to Pages Functions. D1 is bound as `DB`. */
export interface Env {
  DB: D1Database;
}
