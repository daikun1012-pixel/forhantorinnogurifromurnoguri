import type { Env } from "../../../types";
import { HttpError, handle, readJson, str, success } from "../../../_lib/http";
import { newId } from "../../../_lib/db";
import { requireCouple, requireUser } from "../../../_lib/session";
import type { Ctx } from "../../../_lib/session";
import { toComment } from "../../../_lib/mappers";
import { notifyPartner, userName } from "../../../_lib/notify";

async function assertPlace(
  ctx: Ctx,
  coupleId: string,
  placeId: string,
): Promise<string> {
  const place = await ctx.db
    .prepare(`SELECT name FROM places WHERE id = ? AND couple_id = ?`)
    .bind(placeId, coupleId)
    .first<{ name: string }>();
  if (!place) throw new HttpError("장소를 찾을 수 없습니다", 404);
  return place.name;
}

// GET /api/places/:placeId/comments
export const onRequestGet: PagesFunction<Env> = ({ env, request, params }) =>
  handle(async () => {
    const ctx = await requireUser(env, request);
    const coupleId = await requireCouple(ctx);
    const placeId = String(params.placeId);
    await assertPlace(ctx, coupleId, placeId);
    const { results } = await ctx.db
      .prepare(
        `SELECT * FROM place_comments WHERE place_id = ? ORDER BY created_at ASC`,
      )
      .bind(placeId)
      .all();
    return success((results ?? []).map(toComment));
  });

// POST /api/places/:placeId/comments { body }
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
    const placeName = await assertPlace(ctx, coupleId, placeId);
    const body = await readJson(request);
    const comment = {
      id: newId("cmt"),
      place_id: placeId,
      user_id: ctx.userId,
      body: str(body, "body", { max: 1000 }),
      created_at: new Date().toISOString(),
    };
    await env.DB.prepare(
      `INSERT INTO place_comments (id, place_id, user_id, body, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
      .bind(
        comment.id,
        comment.place_id,
        comment.user_id,
        comment.body,
        comment.created_at,
      )
      .run();

    waitUntil(
      userName(env, ctx.userId).then((name) =>
        notifyPartner(env, coupleId, ctx.userId, {
          title: "💬 새 댓글",
          body: `${name} · '${placeName}': ${comment.body}`,
          url: "/places",
        }),
      ),
    );

    return success(toComment(comment), 201);
  });
