import type { Env } from "../../types";
import { HttpError, handle, success } from "../../_lib/http";
import { requireUser } from "../../_lib/session";
import {
  pushConfigured,
  sendPush,
  vapidSelfCheck,
  type PushSubscription,
} from "../../_lib/push";

interface SubRow extends PushSubscription {
  id: string;
}

// POST /api/push/test — send a test notification to the current user's own
// devices and report the push service result (for diagnostics).
export const onRequestPost: PagesFunction<Env> = ({ env, request }) =>
  handle(async () => {
    const ctx = await requireUser(env, request);
    if (!pushConfigured(env)) {
      throw new HttpError("서버에 푸시 키가 설정되지 않았습니다", 503);
    }

    const { results } = await ctx.db
      .prepare(
        `SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?`,
      )
      .bind(ctx.userId)
      .all<SubRow>();

    const subs = results ?? [];
    const outcomes = [];
    for (const sub of subs) {
      try {
        const r = await sendPush(env, sub, {
          title: "테스트 알림 🔔",
          body: "알림이 정상적으로 도착했어요!",
          url: "/",
        });
        if (r.gone) {
          await env.DB.prepare(`DELETE FROM push_subscriptions WHERE id = ?`)
            .bind(sub.id)
            .run();
        }
        outcomes.push({
          endpoint: new URL(sub.endpoint).host,
          status: r.status,
          ok: r.ok,
          error: r.error,
        });
      } catch (err) {
        outcomes.push({
          endpoint: new URL(sub.endpoint).host,
          status: 0,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const selfCheck = await vapidSelfCheck(env);
    return success({ subscriptions: subs.length, outcomes, selfCheck });
  });
