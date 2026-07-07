import type { Env } from "../../types";
import { CURRENT_COUPLE_ID, CURRENT_USER_ID } from "../../_lib/auth";
import {
  handle,
  readJson,
  requireEnum,
  requireNumber,
  requireString,
  optionalString,
  success,
} from "../../_lib/http";
import { PLACE_CATEGORIES, rowToPlace } from "../../_lib/mappers";

// GET /api/places — list places for the current couple.
export const onRequestGet: PagesFunction<Env> = ({ env }) =>
  handle(async () => {
    const { results } = await env.DB.prepare(
      `SELECT * FROM places WHERE couple_id = ? ORDER BY created_at DESC`,
    )
      .bind(CURRENT_COUPLE_ID)
      .all();
    return success((results ?? []).map(rowToPlace));
  });

// POST /api/places — create a place for the current couple.
export const onRequestPost: PagesFunction<Env> = ({ env, request }) =>
  handle(async () => {
    const body = await readJson(request);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const place = {
      id,
      couple_id: CURRENT_COUPLE_ID,
      name: requireString(body, "name"),
      category: requireEnum(body, "category", PLACE_CATEGORIES),
      address: optionalString(body, "address"),
      road_address: optionalString(body, "roadAddress"),
      latitude: requireNumber(body, "latitude"),
      longitude: requireNumber(body, "longitude"),
      source_url: optionalString(body, "sourceUrl"),
      created_by: CURRENT_USER_ID,
      created_at: now,
      updated_at: now,
    };

    await env.DB.prepare(
      `INSERT INTO places
         (id, couple_id, name, category, address, road_address,
          latitude, longitude, source_url, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        place.id,
        place.couple_id,
        place.name,
        place.category,
        place.address,
        place.road_address,
        place.latitude,
        place.longitude,
        place.source_url,
        place.created_by,
        place.created_at,
        place.updated_at,
      )
      .run();

    return success(rowToPlace(place), 201);
  });
