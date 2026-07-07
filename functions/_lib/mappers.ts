import type {
  Couple,
  CoupleMember,
  Place,
  PlaceComment,
  PlaceReaction,
  User,
} from "../../src/types";

type Row = Record<string, unknown>;

export const CATEGORIES = [
  "cafe",
  "restaurant",
  "exhibition",
  "walk",
  "travel",
  "shopping",
  "etc",
] as const;

export const PRIORITIES = ["low", "medium", "high"] as const;

export function toUser(r: Row): User {
  return {
    id: String(r.id),
    name: String(r.name),
    avatarColor: String(r.avatar_color),
    createdAt: String(r.created_at),
  };
}

export function toCouple(r: Row): Couple {
  return {
    id: String(r.id),
    name: String(r.name),
    inviteCode: String(r.invite_code),
    createdAt: String(r.created_at),
  };
}

export function toMember(r: Row): CoupleMember {
  return {
    coupleId: String(r.couple_id),
    userId: String(r.user_id),
    role: r.role as CoupleMember["role"],
    joinedAt: String(r.joined_at),
    user: {
      id: String(r.user_id),
      name: String(r.name),
      avatarColor: String(r.avatar_color),
      createdAt: String(r.user_created_at),
    },
  };
}

export function toPlace(r: Row): Place {
  return {
    id: String(r.id),
    coupleId: String(r.couple_id),
    name: String(r.name),
    category: r.category as Place["category"],
    address: String(r.address ?? ""),
    mapUrl: String(r.map_url ?? ""),
    latitude: r.latitude == null ? null : Number(r.latitude),
    longitude: r.longitude == null ? null : Number(r.longitude),
    createdBy: String(r.created_by),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export function toReaction(r: Row): PlaceReaction {
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

export function toComment(r: Row): PlaceComment {
  return {
    id: String(r.id),
    placeId: String(r.place_id),
    userId: String(r.user_id),
    body: String(r.body),
    createdAt: String(r.created_at),
  };
}
