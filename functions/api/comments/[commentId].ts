import type { Env } from "../../types";
import { HttpError, handle, success } from "../../_lib/http";
import { requireCouple, requireUser } from "../../_lib/session";

// DELETE /api/comments/:commentId — author only, within the couple.
export const onRequestDelete: PagesFunction<Env> = ({ env, request, params }) =>
  handle(async () => {
    const ctx = await requireUser(env, request);
    const coupleId = await requireCouple(ctx);
    const commentId = String(params.commentId);

    const row = await ctx.db
      .prepare(
        `SELECT c.user_id FROM place_comments c
           JOIN places p ON p.id = c.place_id
          WHERE c.id = ? AND p.couple_id = ?`,
      )
      .bind(commentId, coupleId)
      .first<{ user_id: string }>();
    if (!row) throw new HttpError("댓글을 찾을 수 없습니다", 404);
    if (row.user_id !== ctx.userId) {
      throw new HttpError("본인 댓글만 삭제할 수 있습니다", 403);
    }

    await env.DB.prepare(`DELETE FROM place_comments WHERE id = ?`)
      .bind(commentId)
      .run();
    return success({ id: commentId, deleted: true });
  });
