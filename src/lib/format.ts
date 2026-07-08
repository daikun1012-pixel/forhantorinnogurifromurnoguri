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

/** Naver Map link that opens the place so the user can get directions. */
export function naverMapUrl(place: {
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}): string {
  const query = [place.name, place.address].filter(Boolean).join(" ").trim();
  const base = `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
  if (place.latitude != null && place.longitude != null) {
    // Center the map on the exact coordinates when we have them.
    return `${base}?c=${place.longitude},${place.latitude},15,0,0,0,dh`;
  }
  return base;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
