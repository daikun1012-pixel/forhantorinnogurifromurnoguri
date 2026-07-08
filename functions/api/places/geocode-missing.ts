import type { Env } from "../../types";
import { handle, success } from "../../_lib/http";
import { requireCouple, requireUser } from "../../_lib/session";
import { geocodeAddress, geocodeEnabled } from "../../_lib/geocode";

// POST /api/places/geocode-missing — backfill coordinates for the couple's
// places that have an address but no lat/lng yet (e.g. added by hand).
export const onRequestPost: PagesFunction<Env> = ({ env, request }) =>
  handle(async () => {
    const ctx = await requireUser(env, request);
    const coupleId = await requireCouple(ctx);
    if (!geocodeEnabled(env)) return success({ updated: 0 });

    const { results } = await ctx.db
      .prepare(
        `SELECT id, address FROM places
          WHERE couple_id = ? AND latitude IS NULL AND address <> ''
          LIMIT 20`,
      )
      .bind(coupleId)
      .all<{ id: string; address: string }>();

    let updated = 0;
    for (const row of results ?? []) {
      const geo = await geocodeAddress(env, row.address);
      if (!geo) continue;
      await ctx.db
        .prepare(
          `UPDATE places SET latitude = ?, longitude = ?, updated_at = ?
            WHERE id = ? AND couple_id = ?`,
        )
        .bind(geo.lat, geo.lng, new Date().toISOString(), row.id, coupleId)
        .run();
      updated++;
    }

    return success({ updated });
  });
