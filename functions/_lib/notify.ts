/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../types";
import { pushConfigured, sendPush, type PushSubscription } from "./push";

export interface NotifyPayload {
  title: string;
  body: string;
  url?: string;
}

interface SubRow extends PushSubscription {
  id: string;
}

/**
 * Push a notification to every couple member except the actor. Best-effort:
 * failures are swallowed and dead subscriptions (404/410) are pruned. Intended
 * to be handed to context.waitUntil so it never blocks the response.
 */
export async function notifyPartner(
  env: Env,
  coupleId: string,
  actorUserId: string,
  payload: NotifyPayload,
): Promise<void> {
  if (!pushConfigured(env)) return;
  try {
    const { results } = await env.DB.prepare(
      `SELECT s.id, s.endpoint, s.p256dh, s.auth
         FROM push_subscriptions s
         JOIN couple_members m ON m.user_id = s.user_id
        WHERE m.couple_id = ? AND s.user_id != ?`,
    )
      .bind(coupleId, actorUserId)
      .all<SubRow>();

    for (const sub of results ?? []) {
      try {
        const r = await sendPush(env, sub, payload);
        if (r.gone) {
          await env.DB.prepare(`DELETE FROM push_subscriptions WHERE id = ?`)
            .bind(sub.id)
            .run();
        }
      } catch {
        // ignore a single failed send
      }
    }
  } catch {
    // ignore notification errors entirely
  }
}

/** Look up a user's display name (for notification text). */
export async function userName(env: Env, userId: string): Promise<string> {
  const row = await env.DB.prepare(`SELECT name FROM users WHERE id = ?`)
    .bind(userId)
    .first<{ name: string }>();
  return row?.name ?? "상대방";
}
