import type { Env } from "../types";
import { ensureSchema } from "../_lib/db";
import { handle, success } from "../_lib/http";

export const onRequestGet: PagesFunction<Env> = ({ env }) =>
  handle(async () => {
    await ensureSchema(env.DB);
    return success({ status: "ok", time: new Date().toISOString() });
  });
