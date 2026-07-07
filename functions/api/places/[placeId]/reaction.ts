import type { Env } from "../../../types";
import { CURRENT_COUPLE_ID, CURRENT_USER_ID } from "../../../_lib/auth";
import {
  HttpError,
  handle,
  optionalString,
  readJson,
  requireEnum,
  success,
} from "../../../_lib/http";
import { PRIORITIES, rowToReaction } from "../../../_lib/mappers";

// PUT /api/places/:placeId/reaction — upsert the current user's reaction.
export const onRequestPut: PagesFunction<Env> = ({ env, params, request }) =>
  handle(async () => {
    const placeId = String(params.placeId);

    const place = await env.DB.prepare(
      `SELECT id FROM places WHERE id = ? AND couple_id = ?`,
    )
      .bind(placeId, CURRENT_COUPLE_ID)
      .first();
    if (!place) throw new HttpError("Place not found", 404);

    const body = await readJson(request);
    const wantToGo = body.wantToGo === true ? 1 : 0;
    const visited = body.visited === true ? 1 : 0;
    const priority = requireEnum(body, "priority", PRIORITIES);
    const memo = optionalString(body, "memo");
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await env.DB.prepare(
      `INSERT INTO place_reactions
         (id, place_id, user_id, want_to_go, visited, priority, memo,
          created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (place_id, user_id) DO UPDATE SET
         want_to_go = excluded.want_to_go,
         visited    = excluded.visited,
         priority   = excluded.priority,
         memo       = excluded.memo,
         updated_at = excluded.updated_at`,
    )
      .bind(
        id,
        placeId,
        CURRENT_USER_ID,
        wantToGo,
        visited,
        priority,
        memo,
        now,
        now,
      )
      .run();

    const row = await env.DB.prepare(
      `SELECT * FROM place_reactions WHERE place_id = ? AND user_id = ?`,
    )
      .bind(placeId, CURRENT_USER_ID)
      .first<Record<string, unknown>>();

    return success(rowToReaction(row!));
  });
