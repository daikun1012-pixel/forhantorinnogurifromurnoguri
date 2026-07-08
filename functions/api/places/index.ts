import type { Env } from "../../types";
import { newId } from "../../_lib/db";
import { handle, numOrNull, oneOf, readJson, str, success } from "../../_lib/http";
import { requireCouple, requireUser } from "../../_lib/session";
import { CATEGORIES, toPlace, toReaction } from "../../_lib/mappers";
import { geocodeAddress } from "../../_lib/geocode";

// GET /api/places — couple's places, each with the couple's reactions.
export const onRequestGet: PagesFunction<Env> = ({ env, request }) =>
  handle(async () => {
    const ctx = await requireUser(env, request);
    const coupleId = await requireCouple(ctx);

    const places = await ctx.db
      .prepare(`SELECT * FROM places WHERE couple_id = ? ORDER BY created_at DESC`)
      .bind(coupleId)
      .all();

    const reactions = await ctx.db
      .prepare(
        `SELECT r.* FROM place_reactions r
           JOIN places p ON p.id = r.place_id
          WHERE p.couple_id = ?`,
      )
      .bind(coupleId)
      .all();

    const byPlace = new Map<string, ReturnType<typeof toReaction>[]>();
    for (const row of reactions.results ?? []) {
      const rx = toReaction(row);
      const list = byPlace.get(rx.placeId) ?? [];
      list.push(rx);
      byPlace.set(rx.placeId, list);
    }

    const data = (places.results ?? []).map((row) => {
      const place = toPlace(row);
      return { ...place, reactions: byPlace.get(place.id) ?? [] };
    });
    return success(data);
  });

// POST /api/places — add a place to the couple's list.
export const onRequestPost: PagesFunction<Env> = ({ env, request }) =>
  handle(async () => {
    const ctx = await requireUser(env, request);
    const coupleId = await requireCouple(ctx);
    const body = await readJson(request);
    const now = new Date().toISOString();

    const address = str(body, "address", { required: false, max: 300 });
    let latitude = numOrNull(body, "latitude");
    let longitude = numOrNull(body, "longitude");
    // No coordinates from search? Geocode the typed address if possible.
    if ((latitude == null || longitude == null) && address) {
      const geo = await geocodeAddress(env, address);
      if (geo) {
        latitude = geo.lat;
        longitude = geo.lng;
      }
    }

    const place = {
      id: newId("place"),
      couple_id: coupleId,
      name: str(body, "name", { max: 120 }),
      category: oneOf(body, "category", CATEGORIES, "etc"),
      address,
      map_url: str(body, "mapUrl", { required: false, max: 500 }),
      latitude,
      longitude,
      created_by: ctx.userId,
      created_at: now,
      updated_at: now,
    };
    await env.DB.prepare(
      `INSERT INTO places
         (id, couple_id, name, category, address, map_url, latitude, longitude, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        place.id,
        place.couple_id,
        place.name,
        place.category,
        place.address,
        place.map_url,
        place.latitude,
        place.longitude,
        place.created_by,
        place.created_at,
        place.updated_at,
      )
      .run();

    return success({ ...toPlace(place), reactions: [] }, 201);
  });
