import type { Env } from "../../types";
import { handle, readJson, str, success } from "../../_lib/http";
import { requireUser } from "../../_lib/session";
import { newId } from "../../_lib/db";

// POST /api/push/subscribe { endpoint, keys: { p256dh, auth } }
export const onRequestPost: PagesFunction<Env> = ({ env, request }) =>
  handle(async () => {
    const ctx = await requireUser(env, request);
    const body = await readJson<{
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    }>(request);

    const endpoint = str({ endpoint: body.endpoint }, "endpoint", { max: 1000 });
    const keys = body.keys ?? {};
    const p256dh = str(keys as Record<string, unknown>, "p256dh", { max: 300 });
    const auth = str(keys as Record<string, unknown>, "auth", { max: 300 });
    const now = new Date().toISOString();

    // Upsert by endpoint; re-bind to the current user if it moved.
    await env.DB.prepare(
      `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (endpoint) DO UPDATE SET
         user_id = excluded.user_id,
         p256dh = excluded.p256dh,
         auth = excluded.auth`,
    )
      .bind(newId("push"), ctx.userId, endpoint, p256dh, auth, now)
      .run();

    return success({ subscribed: true });
  });
