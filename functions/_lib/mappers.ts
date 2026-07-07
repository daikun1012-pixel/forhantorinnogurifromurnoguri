// Map snake_case D1 rows to the camelCase shapes in src/types/index.ts.

import type {
  Place,
  PlaceComment,
  PlaceReaction,
} from "../../src/types";

export const PLACE_CATEGORIES = [
  "cafe",
  "restaurant",
  "activity",
  "travel",
  "shopping",
  "etc",
] as const;

export const PRIORITIES = ["low", "medium", "high"] as const;

export function rowToPlace(r: Record<string, unknown>): Place {
  return {
    id: String(r.id),
    coupleId: String(r.couple_id),
    name: String(r.name),
    category: r.category as Place["category"],
    address: String(r.address),
    roadAddress: String(r.road_address),
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    sourceUrl: String(r.source_url ?? ""),
    createdBy: String(r.created_by),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export function rowToReaction(r: Record<string, unknown>): PlaceReaction {
  return {
    id: String(r.id),
    placeId: String(r.place_id),
    userId: String(r.user_id),
    wantToGo: Number(r.want_to_go) === 1,
    visited: Number(r.visited) === 1,
    priority: r.priority as PlaceReaction["priority"],
    memo: String(r.memo ?? ""),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export function rowToComment(r: Record<string, unknown>): PlaceComment {
  return {
    id: String(r.id),
    placeId: String(r.place_id),
    userId: String(r.user_id),
    body: String(r.body),
    createdAt: String(r.created_at),
  };
}
