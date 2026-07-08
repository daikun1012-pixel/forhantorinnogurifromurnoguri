import type { Env } from "../../../types";
import { HttpError, handle, success } from "../../../_lib/http";
import { requireCouple, requireUser } from "../../../_lib/session";

// DELETE /api/couples/members/:userId — owner removes the partner from the
// couple (and clears that member's reactions/comments on shared places).
export const onRequestDelete: PagesFunction<Env> = ({ env, request, params }) =>
  handle(async () => {
    const ctx = await requireUser(env, request);
    const coupleId = await requireCouple(ctx);
    const targetId = String(params.userId);

    const me = await ctx.db
      .prepare(
        `SELECT role FROM couple_members WHERE couple_id = ? AND user_id = ?`,
      )
      .bind(coupleId, ctx.userId)
      .first<{ role: string }>();
    if (!me || me.role !== "owner") {
      throw new HttpError("개설자만 내보낼 수 있습니다", 403);
    }
    if (targetId === ctx.userId) {
      throw new HttpError("자신은 내보낼 수 없습니다", 400);
    }

    const target = await ctx.db
      .prepare(
        `SELECT user_id FROM couple_members WHERE couple_id = ? AND user_id = ?`,
      )
      .bind(coupleId, targetId)
      .first();
    if (!target) throw new HttpError("해당 멤버가 없습니다", 404);

    await env.DB.batch([
      env.DB.prepare(
        `DELETE FROM place_reactions
          WHERE user_id = ?
            AND place_id IN (SELECT id FROM places WHERE couple_id = ?)`,
      ).bind(targetId, coupleId),
      env.DB.prepare(
        `DELETE FROM place_comments
          WHERE user_id = ?
            AND place_id IN (SELECT id FROM places WHERE couple_id = ?)`,
      ).bind(targetId, coupleId),
      env.DB.prepare(
        `DELETE FROM couple_members WHERE couple_id = ? AND user_id = ?`,
      ).bind(coupleId, targetId),
    ]);

    return success({ removed: targetId });
  });
