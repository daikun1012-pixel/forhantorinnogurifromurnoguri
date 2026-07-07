import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useSession } from "@/lib/session";
import { PlaceCard } from "@/components/PlaceCard";
import { AddPlaceModal } from "@/components/AddPlaceModal";
import { PlaceDetailModal } from "@/components/PlaceDetailModal";
import { EmptyState, ErrorState, Spinner } from "@/components/ui";
import { categoryLabels, categoryList } from "@/lib/format";
import type { PlaceCategory, PlaceWithReactions } from "@/types";

type CatFilter = "all" | PlaceCategory;

export function PlacesPage() {
  const { session } = useSession();
  const members = session?.members ?? [];
  const currentUserId = session?.user.id ?? "";

  const [places, setPlaces] = useState<PlaceWithReactions[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cat, setCat] = useState<CatFilter>("all");
  const [onlyBoth, setOnlyBoth] = useState(false);
  const [hideVisited, setHideVisited] = useState(false);
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

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

  const visible = useMemo(() => {
    if (!places) return [];
    return places.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      const wanters = p.reactions.filter((r) => r.wantToGo).map((r) => r.userId);
      const bothWant =
        members.length === 2 && members.every((m) => wanters.includes(m.userId));
      if (onlyBoth && !bothWant) return false;
      const visited = p.reactions.length > 0 && p.reactions.every((r) => r.visited);
      if (hideVisited && visited) return false;
      return true;
    });
  }, [places, cat, onlyBoth, hideVisited, members]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-800">
          가고 싶은 곳{" "}
          {places && <span className="text-blush-400">{places.length}</span>}
        </h1>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="btn-primary px-4 py-2"
        >
          + 추가
        </button>
      </div>

      {/* Filters */}
      <div className="-mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-1">
        <FilterChip active={cat === "all"} onClick={() => setCat("all")}>
          전체
        </FilterChip>
        {categoryList.map((c) => (
          <FilterChip key={c} active={cat === c} onClick={() => setCat(c)}>
            {categoryLabels[c]}
          </FilterChip>
        ))}
      </div>
      <div className="mb-4 flex gap-2">
        <FilterChip active={onlyBoth} onClick={() => setOnlyBoth((v) => !v)}>
          💞 둘 다 가고 싶어
        </FilterChip>
        <FilterChip active={hideVisited} onClick={() => setHideVisited((v) => !v)}>
          다녀온 곳 숨기기
        </FilterChip>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !places ? (
        <Spinner label="불러오는 중…" />
      ) : visible.length === 0 ? (
        <EmptyState
          emoji="🗺️"
          title={places.length === 0 ? "아직 저장된 곳이 없어요" : "조건에 맞는 곳이 없어요"}
          description={
            places.length === 0
              ? "가고 싶은 장소를 추가해 보세요."
              : "필터를 조정해 보세요."
          }
          action={
            places.length === 0 ? (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="btn-primary"
              >
                첫 장소 추가하기
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((p) => (
            <PlaceCard
              key={p.id}
              place={p}
              members={members}
              onClick={() => setOpenId(p.id)}
            />
          ))}
        </div>
      )}

      {adding && (
        <AddPlaceModal
          onClose={() => setAdding(false)}
          onCreated={(place) =>
            setPlaces((prev) => (prev ? [place, ...prev] : [place]))
          }
        />
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

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`chip shrink-0 ring-1 ${
        active
          ? "bg-blush-400 text-white ring-blush-400"
          : "bg-white text-zinc-500 ring-blush-100"
      }`}
    >
      {children}
    </button>
  );
}
