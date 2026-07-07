import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { categoryEmoji } from "@/lib/format";
import { ErrorState, Spinner } from "@/components/ui";
import type { PlaceWithReactions } from "@/types";

export function MapPage() {
  const [places, setPlaces] = useState<PlaceWithReactions[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPlaces(await api.listPlaces());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "불러오지 못했습니다");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-zinc-800">지도</h1>

      <div className="overflow-hidden rounded-3xl ring-1 ring-blush-100">
        <div
          className="flex h-64 flex-col items-center justify-center bg-blush-50 text-center"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(253,164,179,0.25) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(96,165,250,0.2) 0, transparent 40%)",
          }}
        >
          <div className="text-5xl">🗺️</div>
          <h2 className="mt-3 text-base font-semibold text-zinc-700">
            지도는 준비 중이에요
          </h2>
          <p className="mt-1 max-w-xs px-6 text-sm text-zinc-400">
            네이버 지도 연동은 다음 단계에서 추가될 예정입니다. 지금은 저장된
            장소를 아래 목록으로 볼 수 있어요.
          </p>
        </div>
      </div>

      <div className="mt-4">
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !places ? (
          <Spinner />
        ) : (
          <>
            <h3 className="mb-2 text-sm font-semibold text-zinc-500">
              지도에 표시될 장소 ({places.length})
            </h3>
            <div className="space-y-2">
              {places.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-blush-50"
                >
                  <span className="text-lg">{categoryEmoji[p.category]}</span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-700">
                      {p.name}
                    </div>
                    {p.address && (
                      <div className="truncate text-xs text-zinc-400">
                        {p.address}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
