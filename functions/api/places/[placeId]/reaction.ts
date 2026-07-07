import type { Env } from "../../../types";
import {
  HttpError,
  bool,
  handle,
  oneOf,
  readJson,
  str,
  success,
} from "../../../_lib/http";
import { newId } from "../../../_lib/db";
import { requireCouple, requireUser } from "../../../_lib/session";
import { PRIORITIES, toReaction } from "../../../_lib/mappers";

// PUT /api/places/:placeId/reaction — upsert the current user's reaction.
export const onRequestPut: PagesFunction<Env> = ({ env, request, params }) =>
  handle(async () => {
    const ctx = await requireUser(env, request);
    const coupleId = await requireCouple(ctx);
    const placeId = String(params.placeId);

    const place = await ctx.db
      .prepare(`SELECT id FROM places WHERE id = ? AND couple_id = ?`)
      .bind(placeId, coupleId)
      .first();
    if (!place) throw new HttpError("장소를 찾을 수 없습니다", 404);

    const body = await readJson(request);
    const wantToGo = bool(body, "wantToGo") ? 1 : 0;
    const visited = bool(body, "visited") ? 1 : 0;
    const priority = oneOf(body, "priority", PRIORITIES, "medium");
    const memo = str(body, "memo", { required: false, max: 1000 });
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO place_reactions
         (id, place_id, user_id, want_to_go, visited, priority, memo, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (place_id, user_id) DO UPDATE SET
         want_to_go = excluded.want_to_go,
         visited = excluded.visited,
         priority = excluded.priority,
         memo = excluded.memo,
         updated_at = excluded.updated_at`,
    )
      .bind(
        newId("react"),
        placeId,
        ctx.userId,
        wantToGo,
        visited,
        priority,
        memo,
        now,
        now,
      )
      .run();

    const row = await ctx.db
      .prepare(`SELECT * FROM place_reactions WHERE place_id = ? AND user_id = ?`)
      .bind(placeId, ctx.userId)
      .first<Record<string, unknown>>();
    return success(toReaction(row!));
  });
