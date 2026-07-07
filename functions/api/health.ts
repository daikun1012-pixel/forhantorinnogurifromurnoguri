import type { Env } from "../types";
import { success } from "../_lib/http";

export const onRequestGet: PagesFunction<Env> = async () => {
  return success({ status: "ok", time: new Date().toISOString() });
};
