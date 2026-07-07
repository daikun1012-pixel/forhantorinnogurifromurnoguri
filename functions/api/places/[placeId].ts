import type { Env } from "../../types";
import { CURRENT_COUPLE_ID } from "../../_lib/auth";
import {
  HttpError,
  handle,
  readJson,
  requireEnum,
  success,
} from "../../_lib/http";
import {
  PLACE_CATEGORIES,
  rowToComment,
  rowToPlace,
  rowToReaction,
} from "../../_lib/mappers";

async function loadPlace(env: Env, placeId: string) {
  const row = await env.DB.prepare(
    `SELECT * FROM places WHERE id = ? AND couple_id = ?`,
  )
    .bind(placeId, CURRENT_COUPLE_ID)
    .first<Record<string, unknown>>();
  if (!row) throw new HttpError("Place not found", 404);
  return row;
}

// GET /api/places/:placeId — place with its reactions and comments.
export const onRequestGet: PagesFunction<Env> = ({ env, params }) =>
  handle(async () => {
    const placeId = String(params.placeId);
    const place = await loadPlace(env, placeId);

    const [reactions, comments] = await Promise.all([
      env.DB.prepare(`SELECT * FROM place_reactions WHERE place_id = ?`)
        .bind(placeId)
        .all(),
      env.DB.prepare(
        `SELECT * FROM place_comments WHERE place_id = ? ORDER BY created_at ASC`,
      )
        .bind(placeId)
        .all(),
    ]);

    return success({
      place: rowToPlace(place),
      reactions: (reactions.results ?? []).map(rowToReaction),
      comments: (comments.results ?? []).map(rowToComment),
    });
  });

// PATCH /api/places/:placeId — update mutable place fields.
export const onRequestPatch: PagesFunction<Env> = ({ env, params, request }) =>
  handle(async () => {
    const placeId = String(params.placeId);
    await loadPlace(env, placeId);
    const body = await readJson(request);

    const sets: string[] = [];
    const values: unknown[] = [];
    const textFields: Record<string, string> = {
      name: "name",
      address: "address",
      roadAddress: "road_address",
      sourceUrl: "source_url",
    };
    for (const [key, column] of Object.entries(textFields)) {
      if (typeof body[key] === "string") {
        sets.push(`${column} = ?`);
        values.push(body[key]);
      }
    }
    if (body.category !== undefined) {
      sets.push("category = ?");
      values.push(requireEnum(body, "category", PLACE_CATEGORIES));
    }
    for (const key of ["latitude", "longitude"] as const) {
      if (typeof body[key] === "number") {
        sets.push(`${key} = ?`);
        values.push(body[key]);
      }
    }
    if (sets.length === 0) {
      throw new HttpError("No updatable fields provided", 422);
    }
    sets.push("updated_at = ?");
    values.push(new Date().toISOString(), placeId, CURRENT_COUPLE_ID);

    await env.DB.prepare(
      `UPDATE places SET ${sets.join(", ")} WHERE id = ? AND couple_id = ?`,
    )
      .bind(...values)
      .run();

    const updated = await loadPlace(env, placeId);
    return success(rowToPlace(updated));
  });

// DELETE /api/places/:placeId
export const onRequestDelete: PagesFunction<Env> = ({ env, params }) =>
  handle(async () => {
    const placeId = String(params.placeId);
    await loadPlace(env, placeId);
    await env.DB.prepare(`DELETE FROM places WHERE id = ? AND couple_id = ?`)
      .bind(placeId, CURRENT_COUPLE_ID)
      .run();
    return success({ id: placeId, deleted: true });
  });
