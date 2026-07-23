import type { Env } from "../../../types";
import { HttpError, handle, success } from "../../../_lib/http";
import { newId } from "../../../_lib/db";
import { requireCouple, requireUser } from "../../../_lib/session";

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

// POST /api/visits/:visitId/photos — upload one image (raw body) to R2.
export const onRequestPost: PagesFunction<Env> = ({ env, request, params }) =>
  handle(async () => {
    const ctx = await requireUser(env, request);
    const coupleId = await requireCouple(ctx);
    if (!env.PHOTOS) throw new HttpError("사진 기능이 설정되지 않았습니다", 503);

    const visitId = String(params.visitId);
    const visit = await ctx.db
      .prepare(`SELECT id FROM visits WHERE id = ? AND couple_id = ?`)
      .bind(visitId, coupleId)
      .first();
    if (!visit) throw new HttpError("기록을 찾을 수 없습니다", 404);

    const contentType = (request.headers.get("Content-Type") || "").split(
      ";",
    )[0];
    if (!ALLOWED.includes(contentType)) {
      throw new HttpError("지원하지 않는 이미지 형식입니다", 415);
    }
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength === 0) throw new HttpError("빈 파일입니다", 422);
    if (bytes.byteLength > MAX_BYTES) {
      throw new HttpError("이미지가 너무 큽니다 (최대 6MB)", 413);
    }

    const photoId = newId("photo");
    const key = `photos/${coupleId}/${photoId}`;
    await env.PHOTOS.put(key, bytes, {
      httpMetadata: { contentType },
    });

    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO visit_photos
         (id, visit_id, couple_id, r2_key, content_type, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(photoId, visitId, coupleId, key, contentType, ctx.userId, now)
      .run();

    return success({ id: photoId }, 201);
  });
