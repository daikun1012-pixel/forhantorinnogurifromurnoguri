import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useSession } from "@/lib/session";
import { categoryEmoji } from "@/lib/format";
import { PlaceDetailModal } from "@/components/PlaceDetailModal";
import { Avatar, EmptyState, ErrorState, Spinner } from "@/components/ui";
import type { VisitWithPlace } from "@/types";

function formatVisitDate(d: string): string {
  const date = new Date(`${d}T00:00:00`);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

export function MemoriesPage() {
  const { session } = useSession();
  const members = session?.members ?? [];
  const currentUserId = session?.user.id ?? "";

  const [visits, setVisits] = useState<VisitWithPlace[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setVisits(await api.listVisits());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "불러오지 못했습니다");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const memberOf = (userId: string) =>
    members.find((m) => m.userId === userId)?.user;

  const remove = async (visitId: string) => {
    await api.deleteVisit(visitId);
    await load();
  };

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-zinc-800">
        우리의 추억{" "}
        {visits && <span className="text-blush-400">{visits.length}</span>}
      </h1>
      <p className="mb-4 text-sm text-zinc-400">
        다녀온 곳의 기록이 차곡차곡 쌓여요
      </p>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !visits ? (
        <Spinner label="불러오는 중…" />
      ) : visits.length === 0 ? (
        <EmptyState
          emoji="📖"
          title="아직 기록된 추억이 없어요"
          description="장소 상세에서 '방문 기록 남기기'로 첫 추억을 남겨보세요."
        />
      ) : (
        <div className="space-y-3">
          {visits.map((v) => {
            const writer = memberOf(v.createdBy);
            return (
              <div key={v.id} className="card">
                <button
                  type="button"
                  onClick={() => setOpenId(v.placeId)}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <span className="mt-0.5 text-2xl">
                    {categoryEmoji[v.placeCategory] ?? "📍"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-blush-400">
                      {formatVisitDate(v.visitedAt)}
                    </div>
                    <div className="truncate text-base font-bold text-zinc-800">
                      {v.placeName}
                    </div>
                    {v.note && (
                      <p className="mt-1.5 rounded-2xl bg-blush-50/60 px-3 py-2 text-sm text-zinc-600">
                        {v.note}
                      </p>
                    )}
                  </div>
                </button>
                <div className="mt-2 flex items-center justify-between border-t border-blush-50 pt-2">
                  <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    {writer && (
                      <Avatar
                        name={writer.name}
                        color={writer.avatarColor}
                        size={16}
                      />
                    )}
                    {writer?.name ?? "알 수 없음"}의 기록
                  </span>
                  {v.createdBy === currentUserId && (
                    <button
                      type="button"
                      onClick={() => remove(v.id)}
                      className="text-[11px] text-zinc-300 hover:text-red-400"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {openId && (
        <PlaceDetailModal
          placeId={openId}
          members={members}
          currentUserId={currentUserId}
          onClose={() => setOpenId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
