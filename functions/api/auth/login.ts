import type { Env } from "../../types";
import { ensureSchema, newId, pickColor } from "../../_lib/db";
import { handle, readJson, str, success } from "../../_lib/http";
import { toUser } from "../../_lib/mappers";

// POST /api/auth/login { name } — creates a lightweight user (nickname auth).
export const onRequestPost: PagesFunction<Env> = ({ env, request }) =>
  handle(async () => {
    await ensureSchema(env.DB);
    const body = await readJson(request);
    const name = str(body, "name", { max: 40 });

    const user = {
      id: newId("user"),
      name,
      avatar_color: pickColor(),
      created_at: new Date().toISOString(),
    };
    await env.DB.prepare(
      `INSERT INTO users (id, name, avatar_color, created_at) VALUES (?, ?, ?, ?)`,
    )
      .bind(user.id, user.name, user.avatar_color, user.created_at)
      .run();

    return success(toUser(user), 201);
  });
