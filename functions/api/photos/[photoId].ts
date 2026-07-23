import type { Env } from "../../types";
import { HttpError, failure, handle, success } from "../../_lib/http";
import { ensureSchema } from "../../_lib/db";
import { requireCouple, requireUser } from "../../_lib/session";

// GET /api/photos/:photoId — stream the image from R2. Unauthenticated so it
// can be used as an <img> src; the photo id is an unguessable random token.
export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  if (!env.PHOTOS) return failure("사진 기능이 설정되지 않았습니다", 503);
  await ensureSchema(env.DB);
  const photoId = String(params.photoId);

  const row = await env.DB.prepare(
    `SELECT r2_key, content_type FROM visit_photos WHERE id = ?`,
  )
    .bind(photoId)
    .first<{ r2_key: string; content_type: string }>();
  if (!row) return failure("사진을 찾을 수 없습니다", 404);

  const object = await env.PHOTOS.get(row.r2_key);
  if (!object) return failure("사진을 찾을 수 없습니다", 404);

  return new Response(object.body, {
    headers: {
      "Content-Type": row.content_type || "image/jpeg",
      "Cache-Control": "private, max-age=31536000, immutable",
      ETag: object.httpEtag,
    },
  });
};

// DELETE /api/photos/:photoId — remove from R2 and the metadata table.
export const onRequestDelete: PagesFunction<Env> = ({ env, request, params }) =>
  handle(async () => {
    const ctx = await requireUser(env, request);
    const coupleId = await requireCouple(ctx);
    const photoId = String(params.photoId);

    const row = await ctx.db
      .prepare(
        `SELECT r2_key, created_by FROM visit_photos WHERE id = ? AND couple_id = ?`,
      )
      .bind(photoId, coupleId)
      .first<{ r2_key: string; created_by: string }>();
    if (!row) throw new HttpError("사진을 찾을 수 없습니다", 404);

    if (env.PHOTOS) await env.PHOTOS.delete(row.r2_key);
    await env.DB.prepare(`DELETE FROM visit_photos WHERE id = ?`)
      .bind(photoId)
      .run();

    return success({ id: photoId, deleted: true });
  });
