import type { Env } from "../../types";
import { handle, success } from "../../_lib/http";
import { requireCouple, requireUser } from "../../_lib/session";
import { toVisit } from "../../_lib/mappers";

// GET /api/visits — the couple's visit history, newest first, with place info.
export const onRequestGet: PagesFunction<Env> = ({ env, request }) =>
  handle(async () => {
    const ctx = await requireUser(env, request);
    const coupleId = await requireCouple(ctx);

    const { results } = await ctx.db
      .prepare(
        `SELECT v.*, p.name AS place_name, p.category AS place_category,
                p.address AS place_address
           FROM visits v
           JOIN places p ON p.id = v.place_id
          WHERE v.couple_id = ?
          ORDER BY v.visited_at DESC, v.created_at DESC`,
      )
      .bind(coupleId)
      .all();

    return success(
      (results ?? []).map((r) => ({
        ...toVisit(r),
        placeName: String(r.place_name),
        placeCategory: r.place_category,
        placeAddress: String(r.place_address ?? ""),
      })),
    );
  });
