import type { ReactNode } from "react";

export function Avatar({
  name,
  color,
  size = 32,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        fontSize: size * 0.42,
      }}
      title={name}
    >
      {name.slice(0, 1)}
    </span>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-400">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-blush-100 border-t-blush-400" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

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
    <div className="flex flex-col items-center justify-center rounded-3xl bg-white/60 px-6 py-14 text-center ring-1 ring-blush-50">
      <div className="mb-3 text-4xl">{emoji}</div>
      <h3 className="text-base font-semibold text-zinc-700">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-zinc-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-white/60 px-6 py-14 text-center ring-1 ring-red-100">
      <div className="mb-2 text-3xl">😢</div>
      <p className="text-sm text-zinc-500">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-soft mt-4">
          다시 시도
        </button>
      )}
    </div>
  );
}
