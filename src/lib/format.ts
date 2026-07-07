import type { PlaceCategory, Priority } from "@/types";

export const categoryLabels: Record<PlaceCategory, string> = {
  cafe: "카페",
  restaurant: "식당",
  exhibition: "전시",
  walk: "산책",
  travel: "여행",
  shopping: "쇼핑",
  etc: "기타",
};

export const categoryEmoji: Record<PlaceCategory, string> = {
  cafe: "☕️",
  restaurant: "🍽️",
  exhibition: "🖼️",
  walk: "🌳",
  travel: "✈️",
  shopping: "🛍️",
  etc: "📍",
};

export const priorityLabels: Record<Priority, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
};

export const priorityClasses: Record<Priority, string> = {
  low: "bg-slate-100 text-slate-500",
  medium: "bg-amber-100 text-amber-600",
  high: "bg-blush-100 text-blush-500",
};

export const categoryList: PlaceCategory[] = [
  "cafe",
  "restaurant",
  "exhibition",
  "walk",
  "travel",
  "shopping",
  "etc",
];

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
