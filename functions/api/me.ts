import type { Env } from "../types";
import { handle, success } from "../_lib/http";
import { requireUser } from "../_lib/session";
import { toCouple, toMember, toUser } from "../_lib/mappers";

// GET /api/me — current user, their couple (if any) and members.
export const onRequestGet: PagesFunction<Env> = ({ env, request }) =>
  handle(async () => {
    const ctx = await requireUser(env, request);

    const userRow = await ctx.db
      .prepare(`SELECT * FROM users WHERE id = ?`)
      .bind(ctx.userId)
      .first<Record<string, unknown>>();

    const coupleRow = await ctx.db
      .prepare(
        `SELECT c.* FROM couples c
           JOIN couple_members m ON m.couple_id = c.id
          WHERE m.user_id = ? LIMIT 1`,
      )
      .bind(ctx.userId)
      .first<Record<string, unknown>>();

    let members: ReturnType<typeof toMember>[] = [];
    if (coupleRow) {
      const { results } = await ctx.db
        .prepare(
          `SELECT m.couple_id, m.user_id, m.role, m.joined_at,
                  u.name, u.avatar_color, u.created_at AS user_created_at
             FROM couple_members m
             JOIN users u ON u.id = m.user_id
            WHERE m.couple_id = ?
            ORDER BY m.joined_at ASC`,
        )
        .bind(String(coupleRow.id))
        .all();
      members = (results ?? []).map(toMember);
    }

    return success({
      user: toUser(userRow!),
      couple: coupleRow ? toCouple(coupleRow) : null,
      members,
    });
  });
