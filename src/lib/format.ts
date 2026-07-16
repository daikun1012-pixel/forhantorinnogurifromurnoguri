import type { PlaceCategory, Priority } from "@/types";

export const categoryLabels: Record<PlaceCategory, string> = {
  cafe: "카페",
  restaurant: "식당",
  exhibition: "전시",
  walk: "산책",
  travel: "여행",
  shopping: "쇼핑",
  movie: "영화·공연",
  watch: "같이 보기",
  taste: "맛보기",
  etc: "기타",
};

export const categoryEmoji: Record<PlaceCategory, string> = {
  cafe: "☕️",
  restaurant: "🍽️",
  exhibition: "🖼️",
  walk: "🌳",
  travel: "✈️",
  shopping: "🛍️",
  movie: "🎬",
  watch: "🍿",
  taste: "🍰",
  etc: "📍",
};

/** Experience categories: things to do together, not tied to a location. */
export const experienceCategories: PlaceCategory[] = [
  "movie",
  "watch",
  "taste",
];

export function isExperience(c: PlaceCategory): boolean {
  return experienceCategories.includes(c);
}

export const wantLabel = (c: PlaceCategory) =>
  isExperience(c) ? "하고 싶어" : "가고 싶어";
export const doneLabel = (c: PlaceCategory) =>
  isExperience(c) ? "해봤어" : "다녀옴";

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
  "movie",
  "watch",
  "taste",
  "etc",
];

/** Location-bound categories (used by the map filters). */
export const placeCategoryList: PlaceCategory[] = categoryList.filter(
  (c) => !isExperience(c),
);

/** Strip floor/unit details that break Naver place search (keeps the road/lot address). */
function cleanAddressForSearch(address: string): string {
  return address
    .replace(/\s+(지하\s*\d*\s*층?|\d+\s*층|\d+\s*호|[Bb]\d+).*$/, "")
    .trim();
}

/**
 * Naver Map link that opens the place so the user can get directions.
 * Searches by address alone (cleaned) — combining name + address returns
 * "no matching place" — falling back to the name when there is no address.
 */
export function naverMapUrl(place: {
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}): string {
  const cleaned = place.address ? cleanAddressForSearch(place.address) : "";
  const query = (cleaned || place.name).trim();
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
