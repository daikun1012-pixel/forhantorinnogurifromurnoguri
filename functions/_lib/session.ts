/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../types";
import { ensureSchema } from "./db";
import { HttpError } from "./http";

export interface Ctx {
  db: D1Database;
  userId: string;
}

/** Resolve the current user from the X-User-Id header (temporary auth). */
export async function requireUser(
  env: Env,
  request: Request,
): Promise<Ctx> {
  await ensureSchema(env.DB);
  const userId = request.headers.get("X-User-Id")?.trim();
  if (!userId) throw new HttpError("로그인이 필요합니다", 401);
  const user = await env.DB.prepare(`SELECT id FROM users WHERE id = ?`)
    .bind(userId)
    .first();
  if (!user) throw new HttpError("로그인이 필요합니다", 401);
  return { db: env.DB, userId };
}

/** The current user's couple id, or throw if they have not joined one. */
export async function requireCouple(ctx: Ctx): Promise<string> {
  const row = await ctx.db
    .prepare(`SELECT couple_id FROM couple_members WHERE user_id = ? LIMIT 1`)
    .bind(ctx.userId)
    .first<{ couple_id: string }>();
  if (!row) throw new HttpError("커플 공간에 참여해 주세요", 403);
  return row.couple_id;
}
