import type { Env } from "../../../types";
import { CURRENT_COUPLE_ID, CURRENT_USER_ID } from "../../../_lib/auth";
import {
  HttpError,
  handle,
  readJson,
  requireString,
  success,
} from "../../../_lib/http";
import { rowToComment } from "../../../_lib/mappers";

async function assertPlace(env: Env, placeId: string) {
  const place = await env.DB.prepare(
    `SELECT id FROM places WHERE id = ? AND couple_id = ?`,
  )
    .bind(placeId, CURRENT_COUPLE_ID)
    .first();
  if (!place) throw new HttpError("Place not found", 404);
}

// GET /api/places/:placeId/comments
export const onRequestGet: PagesFunction<Env> = ({ env, params }) =>
  handle(async () => {
    const placeId = String(params.placeId);
    await assertPlace(env, placeId);
    const { results } = await env.DB.prepare(
      `SELECT * FROM place_comments WHERE place_id = ? ORDER BY created_at ASC`,
    )
      .bind(placeId)
      .all();
    return success((results ?? []).map(rowToComment));
  });

// POST /api/places/:placeId/comments
export const onRequestPost: PagesFunction<Env> = ({ env, params, request }) =>
  handle(async () => {
    const placeId = String(params.placeId);
    await assertPlace(env, placeId);
    const body = await readJson(request);
    const comment = {
      id: crypto.randomUUID(),
      place_id: placeId,
      user_id: CURRENT_USER_ID,
      body: requireString(body, "body"),
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
    return success(rowToComment(comment), 201);
  });
