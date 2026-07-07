import { useEffect } from "react";
import { useStore } from "@/lib/store";
import {
  categoryEmoji,
  categoryLabels,
  formatDateTime,
  priorityClasses,
  priorityLabels,
} from "@/lib/format";
import type { Place } from "@/types";
import { Avatar } from "./Avatar";

export function PlaceDetailModal({
  place,
  onClose,
}: {
  place: Place;
  onClose: () => void;
}) {
  const { getUser, reactionsForPlace, commentsForPlace } = useStore();
  const reactions = reactionsForPlace(place.id);
  const comments = commentsForPlace(place.id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-cream p-5 pb-8 shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-blush-100 sm:hidden" />

        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="chip bg-blush-50 text-blush-500">
              {categoryEmoji[place.category]} {categoryLabels[place.category]}
            </span>
            <h2 className="mt-2 text-xl font-bold text-zinc-800">
              {place.name}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">{place.roadAddress}</p>
            <p className="text-xs text-zinc-400">{place.address}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white p-2 text-zinc-400 ring-1 ring-blush-50"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {place.sourceUrl && (
          <a
            href={place.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-sm font-medium text-blush-500 underline"
          >
            원본 링크 열기 ↗
          </a>
        )}

        {/* Reactions */}
        <section className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-zinc-500">
            두 사람의 반응
          </h3>
          <div className="space-y-3">
            {reactions.map((r) => {
              const user = getUser(r.userId);
              if (!user) return null;
              return (
                <div key={r.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar user={user} />
                      <span className="font-semibold text-zinc-700">
                        {user.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="chip bg-blush-50 text-blush-500">
                        {r.wantToGo ? "💖 가고 싶어" : "🤍 글쎄"}
                      </span>
                      <span className={`chip ${priorityClasses[r.priority]}`}>
                        {priorityLabels[r.priority]}
                      </span>
                      {r.visited && (
                        <span className="chip bg-emerald-50 text-emerald-600">
                          ✓ 방문
                        </span>
                      )}
                    </div>
                  </div>
                  {r.memo && (
                    <p className="mt-2 rounded-2xl bg-blush-50/60 px-3 py-2 text-sm text-zinc-600">
                      {r.memo}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Comments */}
        <section className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-zinc-500">댓글</h3>
          {comments.length === 0 ? (
            <p className="rounded-2xl bg-white px-3 py-4 text-center text-sm text-zinc-300 ring-1 ring-blush-50">
              아직 댓글이 없어요
            </p>
          ) : (
            <div className="space-y-2">
              {comments.map((c) => {
                const user = getUser(c.userId);
                if (!user) return null;
                return (
                  <div key={c.id} className="flex gap-2">
                    <Avatar user={user} size={28} />
                    <div className="rounded-2xl bg-white px-3 py-2 ring-1 ring-blush-50">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-zinc-700">
                          {user.name}
                        </span>
                        <span className="text-[11px] text-zinc-300">
                          {formatDateTime(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600">{c.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Mock actions */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button type="button" className="btn-ghost" disabled>
            💬 댓글 달기
          </button>
          <button type="button" className="btn-primary" disabled>
            ✏️ 반응 수정
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-zinc-300">
          목업 화면입니다 · 실제 저장 기능은 이후 연동 예정
        </p>
      </div>
    </div>
  );
}
