import type { Env } from "../../types";
import { HttpError, handle, readJson, str, success } from "../../_lib/http";
import { requireUser } from "../../_lib/session";
import { toCouple } from "../../_lib/mappers";

// POST /api/couples/join { code } — join an existing couple space.
export const onRequestPost: PagesFunction<Env> = ({ env, request }) =>
  handle(async () => {
    const ctx = await requireUser(env, request);
    const body = await readJson(request);
    const code = str(body, "code", { max: 12 }).toUpperCase();

    const existing = await ctx.db
      .prepare(`SELECT couple_id FROM couple_members WHERE user_id = ? LIMIT 1`)
      .bind(ctx.userId)
      .first();
    if (existing) throw new HttpError("이미 커플 공간에 참여 중입니다", 409);

    const couple = await ctx.db
      .prepare(`SELECT * FROM couples WHERE invite_code = ?`)
      .bind(code)
      .first<Record<string, unknown>>();
    if (!couple) throw new HttpError("초대코드를 찾을 수 없습니다", 404);

    const count = await ctx.db
      .prepare(`SELECT COUNT(*) AS n FROM couple_members WHERE couple_id = ?`)
      .bind(String(couple.id))
      .first<{ n: number }>();
    if ((count?.n ?? 0) >= 2) {
      throw new HttpError("이미 두 명이 참여한 공간입니다", 409);
    }

    await env.DB.prepare(
      `INSERT INTO couple_members (couple_id, user_id, role, joined_at)
       VALUES (?, ?, 'partner', ?)`,
    )
      .bind(String(couple.id), ctx.userId, new Date().toISOString())
      .run();

    return success(toCouple(couple));
  });
