import type { Env } from "../../types";
import { handle, readJson, str, success } from "../../_lib/http";
import { requireUser } from "../../_lib/session";

// POST /api/push/unsubscribe { endpoint }
export const onRequestPost: PagesFunction<Env> = ({ env, request }) =>
  handle(async () => {
    const ctx = await requireUser(env, request);
    const body = await readJson<{ endpoint?: string }>(request);
    const endpoint = str({ endpoint: body.endpoint }, "endpoint", { max: 1000 });

    await env.DB.prepare(
      `DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?`,
    )
      .bind(endpoint, ctx.userId)
      .run();

    return success({ unsubscribed: true });
  });
