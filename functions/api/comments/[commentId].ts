import type { Env } from "../../types";
import { CURRENT_COUPLE_ID } from "../../_lib/auth";
import { HttpError, handle, success } from "../../_lib/http";

// DELETE /api/comments/:commentId — only within the current couple's places.
export const onRequestDelete: PagesFunction<Env> = ({ env, params }) =>
  handle(async () => {
    const commentId = String(params.commentId);
    const row = await env.DB.prepare(
      `SELECT c.id FROM place_comments c
         JOIN places p ON p.id = c.place_id
        WHERE c.id = ? AND p.couple_id = ?`,
    )
      .bind(commentId, CURRENT_COUPLE_ID)
      .first();
    if (!row) throw new HttpError("Comment not found", 404);

    await env.DB.prepare(`DELETE FROM place_comments WHERE id = ?`)
      .bind(commentId)
      .run();
    return success({ id: commentId, deleted: true });
  });
