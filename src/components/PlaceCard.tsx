import { useStore } from "@/lib/store";
import {
  categoryEmoji,
  categoryLabels,
  priorityClasses,
  priorityLabels,
} from "@/lib/format";
import type { Place, Priority } from "@/types";
import { WantToGoBadges } from "./WantToGoBadges";

function topPriority(priorities: Priority[]): Priority | null {
  if (priorities.includes("high")) return "high";
  if (priorities.includes("medium")) return "medium";
  if (priorities.includes("low")) return "low";
  return null;
}

export function PlaceCard({
  place,
  onClick,
}: {
  place: Place;
  onClick: () => void;
}) {
  const { reactionsForPlace } = useStore();
  const reactions = reactionsForPlace(place.id);
  const visited = reactions.length > 0 && reactions.every((r) => r.visited);
  const priority = topPriority(reactions.map((r) => r.priority));

  return (
    <button
      type="button"
      onClick={onClick}
      className="card w-full text-left transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="chip bg-blush-50 text-blush-500">
              {categoryEmoji[place.category]} {categoryLabels[place.category]}
            </span>
            {visited && (
              <span className="chip bg-emerald-50 text-emerald-600">
                ✓ 다녀옴
              </span>
            )}
          </div>
          <h3 className="mt-2 truncate text-base font-bold text-zinc-800">
            {place.name}
          </h3>
          <p className="mt-0.5 truncate text-sm text-zinc-400">
            {place.roadAddress}
          </p>
        </div>
        {priority && (
          <span className={`chip shrink-0 ${priorityClasses[priority]}`}>
            {priorityLabels[priority]}
          </span>
        )}
      </div>

      <div className="mt-3 border-t border-blush-50 pt-3">
        <WantToGoBadges reactions={reactions} />
      </div>
    </button>
  );
}
