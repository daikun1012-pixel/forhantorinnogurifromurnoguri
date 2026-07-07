import type { Env } from "../../types";
import { inviteCode, newId } from "../../_lib/db";
import { HttpError, handle, readJson, str, success } from "../../_lib/http";
import { requireUser } from "../../_lib/session";
import { toCouple } from "../../_lib/mappers";

// POST /api/couples { name? } — create a couple space and join as owner.
export const onRequestPost: PagesFunction<Env> = ({ env, request }) =>
  handle(async () => {
    const ctx = await requireUser(env, request);

    const existing = await ctx.db
      .prepare(`SELECT couple_id FROM couple_members WHERE user_id = ? LIMIT 1`)
      .bind(ctx.userId)
      .first();
    if (existing) throw new HttpError("이미 커플 공간에 참여 중입니다", 409);

    const body = await readJson(request).catch(() => ({}));
    const name = str(body as Record<string, unknown>, "name", {
      required: false,
      max: 40,
    });
    const now = new Date().toISOString();

    // Ensure the invite code is unique (retry a few times).
    let code = inviteCode();
    for (let i = 0; i < 5; i++) {
      const clash = await ctx.db
        .prepare(`SELECT id FROM couples WHERE invite_code = ?`)
        .bind(code)
        .first();
      if (!clash) break;
      code = inviteCode();
    }

    const couple = {
      id: newId("couple"),
      name: name || "우리 공간",
      invite_code: code,
      created_at: now,
    };
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO couples (id, name, invite_code, created_at) VALUES (?, ?, ?, ?)`,
      ).bind(couple.id, couple.name, couple.invite_code, couple.created_at),
      env.DB.prepare(
        `INSERT INTO couple_members (couple_id, user_id, role, joined_at)
         VALUES (?, ?, 'owner', ?)`,
      ).bind(couple.id, ctx.userId, now),
    ]);

    return success(toCouple(couple), 201);
  });
