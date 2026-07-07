import type { ReactNode } from "react";

export function EmptyState({
  emoji,
  title,
  description,
  action,
}: {
  emoji: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-white/60 px-6 py-12 text-center ring-1 ring-blush-50">
      <div className="mb-3 text-4xl">{emoji}</div>
      <h3 className="text-base font-semibold text-zinc-700">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-zinc-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
