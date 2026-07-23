import type { Env } from "../../types";
import {
  HttpError,
  handle,
  oneOf,
  readJson,
  str,
  success,
} from "../../_lib/http";
import { requireCouple, requireUser } from "../../_lib/session";
import type { Ctx } from "../../_lib/session";
import {
  CATEGORIES,
  toComment,
  toPlace,
  toReaction,
  toVisit,
} from "../../_lib/mappers";

async function loadPlace(ctx: Ctx, coupleId: string, placeId: string) {
  const row = await ctx.db
    .prepare(`SELECT * FROM places WHERE id = ? AND couple_id = ?`)
    .bind(placeId, coupleId)
    .first<Record<string, unknown>>();
  if (!row) throw new HttpError("장소를 찾을 수 없습니다", 404);
  return row;
}

// GET /api/places/:placeId — place with reactions and comments.
export const onRequestGet: PagesFunction<Env> = ({ env, request, params }) =>
  handle(async () => {
    const ctx = await requireUser(env, request);
    const coupleId = await requireCouple(ctx);
    const placeId = String(params.placeId);
    const place = await loadPlace(ctx, coupleId, placeId);

    const [reactions, comments, visits, photos] = await Promise.all([
      ctx.db
        .prepare(`SELECT * FROM place_reactions WHERE place_id = ?`)
        .bind(placeId)
        .all(),
      ctx.db
        .prepare(
          `SELECT * FROM place_comments WHERE place_id = ? ORDER BY created_at ASC`,
        )
        .bind(placeId)
        .all(),
      ctx.db
        .prepare(
          `SELECT * FROM visits WHERE place_id = ? ORDER BY visited_at DESC`,
        )
        .bind(placeId)
        .all(),
      ctx.db
        .prepare(
          `SELECT id, visit_id FROM visit_photos
             WHERE visit_id IN (SELECT id FROM visits WHERE place_id = ?)
             ORDER BY created_at ASC`,
        )
        .bind(placeId)
        .all<{ id: string; visit_id: string }>(),
    ]);

    const photosByVisit = new Map<string, string[]>();
    for (const ph of photos.results ?? []) {
      const list = photosByVisit.get(ph.visit_id) ?? [];
      list.push(ph.id);
      photosByVisit.set(ph.visit_id, list);
    }

    return success({
      ...toPlace(place),
      reactions: (reactions.results ?? []).map(toReaction),
      comments: (comments.results ?? []).map(toComment),
      visits: (visits.results ?? []).map((r) => ({
        ...toVisit(r),
        photos: photosByVisit.get(String(r.id)) ?? [],
      })),
    });
  });

// PATCH /api/places/:placeId — update editable fields.
export const onRequestPatch: PagesFunction<Env> = ({ env, request, params }) =>
  handle(async () => {
    const ctx = await requireUser(env, request);
    const coupleId = await requireCouple(ctx);
    const placeId = String(params.placeId);
    await loadPlace(ctx, coupleId, placeId);
    const body = await readJson(request);

    const sets: string[] = [];
    const values: unknown[] = [];
    if (typeof body.name === "string") {
      sets.push("name = ?");
      values.push(str(body, "name", { max: 120 }));
    }
    if (body.category !== undefined) {
      sets.push("category = ?");
      values.push(oneOf(body, "category", CATEGORIES));
    }
    if (typeof body.address === "string") {
      sets.push("address = ?");
      values.push(str(body, "address", { required: false, max: 300 }));
    }
    if (typeof body.mapUrl === "string") {
      sets.push("map_url = ?");
      values.push(str(body, "mapUrl", { required: false, max: 500 }));
    }
    if (sets.length === 0) throw new HttpError("수정할 내용이 없습니다", 422);
    sets.push("updated_at = ?");
    values.push(new Date().toISOString(), placeId, coupleId);

    await env.DB.prepare(
      `UPDATE places SET ${sets.join(", ")} WHERE id = ? AND couple_id = ?`,
    )
      .bind(...values)
      .run();

    const updated = await loadPlace(ctx, coupleId, placeId);
    return success(toPlace(updated));
  });

// DELETE /api/places/:placeId
export const onRequestDelete: PagesFunction<Env> = ({ env, request, params }) =>
  handle(async () => {
    const ctx = await requireUser(env, request);
    const coupleId = await requireCouple(ctx);
    const placeId = String(params.placeId);
    await loadPlace(ctx, coupleId, placeId);
    await env.DB.prepare(`DELETE FROM places WHERE id = ? AND couple_id = ?`)
      .bind(placeId, coupleId)
      .run();
    return success({ id: placeId, deleted: true });
  });
