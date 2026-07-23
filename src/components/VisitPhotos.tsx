import { useRef, useState } from "react";
import { api, ApiError, photoUrl } from "@/lib/api";
import { useSession } from "@/lib/session";
import { compressImage } from "@/lib/image";
import { Modal } from "./Modal";

export function VisitPhotos({
  visitId,
  photoIds,
  canEdit,
  onChanged,
}: {
  visitId: string;
  photoIds: string[];
  canEdit: boolean;
  onChanged: () => Promise<void>;
}) {
  const { config } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const photosEnabled = config?.photosEnabled ?? false;
  if (!photosEnabled && photoIds.length === 0) return null;

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const blob = await compressImage(file);
        await api.uploadVisitPhoto(visitId, blob);
      }
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "업로드 실패");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = async (photoId: string) => {
    await api.deletePhoto(photoId);
    setLightbox(null);
    await onChanged();
  };

  return (
    <div>
      {photoIds.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {photoIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setLightbox(id)}
              className="aspect-square overflow-hidden rounded-xl bg-blush-50 ring-1 ring-blush-50"
            >
              <img
                src={photoUrl(id)}
                alt="추억 사진"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {canEdit && photosEnabled && (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn-soft mt-2 w-full py-2 text-sm"
          >
            {uploading ? "올리는 중…" : "📷 사진 추가"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
        </>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {lightbox && (
        <Modal onClose={() => setLightbox(null)}>
          <img
            src={photoUrl(lightbox)}
            alt="추억 사진"
            className="mx-auto max-h-[70vh] w-auto rounded-2xl"
          />
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="btn-ghost flex-1"
            >
              닫기
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => remove(lightbox)}
                className="btn flex-1 bg-red-500 text-white"
              >
                삭제
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
