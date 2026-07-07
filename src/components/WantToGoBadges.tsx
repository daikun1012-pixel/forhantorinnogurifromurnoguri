import { useStore } from "@/lib/store";
import type { PlaceReaction } from "@/types";

export function WantToGoBadges({ reactions }: { reactions: PlaceReaction[] }) {
  const { getUser } = useStore();

  if (reactions.length === 0) {
    return <span className="text-xs text-zinc-300">아직 반응 없음</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {reactions.map((r) => {
        const user = getUser(r.userId);
        if (!user) return null;
        return (
          <span
            key={r.id}
            className={`chip ring-1 ${
              r.wantToGo
                ? "bg-blush-50 text-blush-500 ring-blush-100"
                : "bg-zinc-50 text-zinc-400 ring-zinc-100"
            }`}
          >
            <span>{r.wantToGo ? "💖" : "🤍"}</span>
            {user.name}
          </span>
        );
      })}
    </div>
  );
}
