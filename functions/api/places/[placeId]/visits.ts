import type { Env } from "../../../types";
import { HttpError, handle, readJson, str, success } from "../../../_lib/http";
import { newId } from "../../../_lib/db";
import { requireCouple, requireUser } from "../../../_lib/session";
import { toVisit } from "../../../_lib/mappers";
import { notifyPartner, userName } from "../../../_lib/notify";

// POST /api/places/:placeId/visits { visitedAt, note } — log a visit.
// Also marks the logger's reaction as visited.
export const onRequestPost: PagesFunction<Env> = ({
  env,
  request,
  params,
  waitUntil,
}) =>
  handle(async () => {
    const ctx = await requireUser(env, request);
    const coupleId = await requireCouple(ctx);
    const placeId = String(params.placeId);

    const place = await ctx.db
      .prepare(`SELECT name FROM places WHERE id = ? AND couple_id = ?`)
      .bind(placeId, coupleId)
      .first<{ name: string }>();
    if (!place) throw new HttpError("장소를 찾을 수 없습니다", 404);

    const body = await readJson(request);
    const visitedAt = str(body, "visitedAt", { max: 10 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(visitedAt)) {
      throw new HttpError("날짜 형식이 올바르지 않습니다", 422);
    }
    const note = str(body, "note", { required: false, max: 1000 });
    const now = new Date().toISOString();

    const visit = {
      id: newId("visit"),
      couple_id: coupleId,
      place_id: placeId,
      visited_at: visitedAt,
      note,
      created_by: ctx.userId,
      created_at: now,
    };

    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO visits (id, couple_id, place_id, visited_at, note, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        visit.id,
        visit.couple_id,
        visit.place_id,
        visit.visited_at,
        visit.note,
        visit.created_by,
        visit.created_at,
      ),
      // Logging a visit implies "visited" for this user.
      env.DB.prepare(
        `INSERT INTO place_reactions
           (id, place_id, user_id, want_to_go, visited, priority, memo, created_at, updated_at)
         VALUES (?, ?, ?, 0, 1, 'medium', '', ?, ?)
         ON CONFLICT (place_id, user_id) DO UPDATE SET
           visited = 1, updated_at = excluded.updated_at`,
      ).bind(newId("react"), placeId, ctx.userId, now, now),
    ]);

    waitUntil(
      userName(env, ctx.userId).then((who) =>
        notifyPartner(env, coupleId, ctx.userId, {
          title: "📖 새 추억",
          body: `${who}님이 '${place.name}' 방문 기록을 남겼어요`,
          url: "/memories",
        }),
      ),
    );

    return success({ ...toVisit(visit), photos: [] }, 201);
  });
