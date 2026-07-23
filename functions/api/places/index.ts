import type { Env } from "../../types";
import { newId } from "../../_lib/db";
import { handle, numOrNull, oneOf, readJson, str, success } from "../../_lib/http";
import { requireCouple, requireUser } from "../../_lib/session";
import { CATEGORIES, toPlace, toReaction } from "../../_lib/mappers";
import { notifyPartner, userName } from "../../_lib/notify";

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
export const onRequestPost: PagesFunction<Env> = ({ env, request, waitUntil }) =>
  handle(async () => {
    const ctx = await requireUser(env, request);
    const coupleId = await requireCouple(ctx);
    const body = await readJson(request);
    const now = new Date().toISOString();

    const address = str(body, "address", { required: false, max: 300 });
    const latitude = numOrNull(body, "latitude");
    const longitude = numOrNull(body, "longitude");
    const name = str(body, "name", { max: 120 });

    // Duplicate check: same name (case/space-insensitive), or the same
    // coordinates when both places came from search.
    const dupConds = [`LOWER(TRIM(name)) = LOWER(TRIM(?))`];
    const dupBinds: unknown[] = [coupleId, name];
    if (latitude != null && longitude != null) {
      dupConds.push(
        `(latitude IS NOT NULL AND ABS(latitude - ?) < 0.00002 AND ABS(longitude - ?) < 0.00002)`,
      );
      dupBinds.push(latitude, longitude);
    }
    const dup = await ctx.db
      .prepare(
        `SELECT * FROM places WHERE couple_id = ? AND (${dupConds.join(" OR ")}) LIMIT 1`,
      )
      .bind(...dupBinds)
      .first<Record<string, unknown>>();

    const upsertWant = (placeId: string) =>
      env.DB.prepare(
        `INSERT INTO place_reactions
           (id, place_id, user_id, want_to_go, visited, priority, memo, created_at, updated_at)
         VALUES (?, ?, ?, 1, 0, 'medium', '', ?, ?)
         ON CONFLICT (place_id, user_id) DO UPDATE SET
           want_to_go = 1, updated_at = excluded.updated_at`,
      ).bind(newId("react"), placeId, ctx.userId, now, now);

    if (dup) {
      // Already saved by the couple — just mark "want to go" for this user.
      const dupId = String(dup.id);
      await upsertWant(dupId).run();
      const { results } = await ctx.db
        .prepare(`SELECT * FROM place_reactions WHERE place_id = ?`)
        .bind(dupId)
        .all();
      const reactions = (results ?? []).map(toReaction);
      const bothWant =
        reactions.filter((r) => r.wantToGo).length >= 2;

      waitUntil(
        userName(env, ctx.userId).then((who) =>
          notifyPartner(env, coupleId, ctx.userId, {
            title: bothWant ? "💞 둘 다 가고 싶은 곳!" : "💖 반응 도착",
            body: bothWant
              ? `'${String(dup.name)}' — 두 사람 모두 가고 싶어 해요!`
              : `${who}님도 '${String(dup.name)}'에 가고 싶어 해요`,
            url: "/places",
          }),
        ),
      );

      return success({ ...toPlace(dup), reactions, duplicate: true });
    }

    const place = {
      id: newId("place"),
      couple_id: coupleId,
      name,
      category: oneOf(body, "category", CATEGORIES, "etc"),
      address,
      map_url: str(body, "mapUrl", { required: false, max: 500 }),
      latitude,
      longitude,
      created_by: ctx.userId,
      created_at: now,
      updated_at: now,
    };
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO places
           (id, couple_id, name, category, address, map_url, latitude, longitude, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
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
      ),
      // Adding a place implies the creator wants to go.
      upsertWant(place.id),
    ]);

    const { results } = await ctx.db
      .prepare(`SELECT * FROM place_reactions WHERE place_id = ?`)
      .bind(place.id)
      .all();

    waitUntil(
      userName(env, ctx.userId).then((who) =>
        notifyPartner(env, coupleId, ctx.userId, {
          title: "새 장소 💗",
          body: `${who}님이 '${place.name}'을(를) 추가했어요`,
          url: "/places",
        }),
      ),
    );

    return success(
      {
        ...toPlace(place),
        reactions: (results ?? []).map(toReaction),
        duplicate: false,
      },
      201,
    );
  });
