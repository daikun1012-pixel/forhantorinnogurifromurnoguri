import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceDetailModal } from "@/components/PlaceDetailModal";
import { EmptyState } from "@/components/EmptyState";
import { categoryLabels } from "@/lib/format";
import type { Place, PlaceCategory } from "@/types";

type Filter = "all" | PlaceCategory;

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "cafe", label: categoryLabels.cafe },
  { key: "restaurant", label: categoryLabels.restaurant },
  { key: "activity", label: categoryLabels.activity },
  { key: "travel", label: categoryLabels.travel },
  { key: "shopping", label: categoryLabels.shopping },
];

export function PlacesPage() {
  const { places } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Place | null>(null);

  const visible = useMemo(
    () =>
      filter === "all"
        ? places
        : places.filter((p) => p.category === filter),
    [places, filter],
  );

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-zinc-800">
          가고 싶은 곳{" "}
          <span className="text-blush-400">{places.length}</span>
        </h1>
      </div>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`chip shrink-0 ring-1 ${
              filter === f.key
                ? "bg-blush-400 text-white ring-blush-400"
                : "bg-white text-zinc-500 ring-blush-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          emoji="🗺️"
          title="아직 저장된 곳이 없어요"
          description="가고 싶은 장소를 추가하면 여기에 카드로 보여요."
        />
      ) : (
        <div className="space-y-3">
          {visible.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onClick={() => setSelected(place)}
            />
          ))}
        </div>
      )}

      {selected && (
        <PlaceDetailModal
          place={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
