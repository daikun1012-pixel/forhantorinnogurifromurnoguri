import type { CoupleMember, PlaceWithReactions, Priority } from "@/types";
import {
  categoryEmoji,
  categoryLabels,
  priorityClasses,
  priorityLabels,
} from "@/lib/format";
import { Avatar } from "./ui";

function topPriority(list: Priority[]): Priority | null {
  if (list.includes("high")) return "high";
  if (list.includes("medium")) return "medium";
  if (list.includes("low")) return "low";
  return null;
}

export function PlaceCard({
  place,
  members,
  onClick,
}: {
  place: PlaceWithReactions;
  members: CoupleMember[];
  onClick: () => void;
}) {
  const reactions = place.reactions;
  const wanters = reactions.filter((r) => r.wantToGo).map((r) => r.userId);
  const bothWant = members.length === 2 && members.every((m) => wanters.includes(m.userId));
  const visited = reactions.length > 0 && reactions.every((r) => r.visited);
  const priority = topPriority(reactions.map((r) => r.priority));

  return (
    <button
      type="button"
      onClick={onClick}
      className={`card w-full text-left transition hover:-translate-y-0.5 hover:shadow-lg ${
        bothWant ? "ring-2 ring-blush-200" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="chip bg-blush-50 text-blush-500">
              {categoryEmoji[place.category]} {categoryLabels[place.category]}
            </span>
            {bothWant && (
              <span className="chip bg-blush-400 text-white">💞 둘 다 가고 싶어</span>
            )}
            {visited && (
              <span className="chip bg-emerald-50 text-emerald-600">✓ 다녀옴</span>
            )}
          </div>
          <h3 className="mt-2 truncate text-base font-bold text-zinc-800">
            {place.name}
          </h3>
          {place.address && (
            <p className="mt-0.5 truncate text-sm text-zinc-400">{place.address}</p>
          )}
        </div>
        {priority && (
          <span className={`chip shrink-0 ${priorityClasses[priority]}`}>
            {priorityLabels[priority]}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-blush-50 pt-3">
        {members.length === 0 && (
          <span className="text-xs text-zinc-300">반응 없음</span>
        )}
        {members.map((m) => {
          const wants = wanters.includes(m.userId);
          return (
            <span
              key={m.userId}
              className={`chip ring-1 ${
                wants
                  ? "bg-blush-50 text-blush-500 ring-blush-100"
                  : "bg-zinc-50 text-zinc-400 ring-zinc-100"
              }`}
            >
              <Avatar name={m.user.name} color={m.user.avatarColor} size={16} />
              {wants ? "가고 싶어" : "글쎄"}
            </span>
          );
        })}
      </div>
    </button>
  );
}
