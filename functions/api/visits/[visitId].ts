import type { Env } from "../../types";
import { HttpError, handle, success } from "../../_lib/http";
import { requireCouple, requireUser } from "../../_lib/session";

// DELETE /api/visits/:visitId — within the couple's records.
export const onRequestDelete: PagesFunction<Env> = ({ env, request, params }) =>
  handle(async () => {
    const ctx = await requireUser(env, request);
    const coupleId = await requireCouple(ctx);
    const visitId = String(params.visitId);

    const row = await ctx.db
      .prepare(`SELECT id FROM visits WHERE id = ? AND couple_id = ?`)
      .bind(visitId, coupleId)
      .first();
    if (!row) throw new HttpError("기록을 찾을 수 없습니다", 404);

    await env.DB.prepare(`DELETE FROM visits WHERE id = ?`)
      .bind(visitId)
      .run();
    return success({ id: visitId, deleted: true });
  });
