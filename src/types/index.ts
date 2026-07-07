export interface User {
  id: string;
  name: string;
  avatarColor: string;
  createdAt: string;
}

export interface Couple {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
}

export interface CoupleMember {
  coupleId: string;
  userId: string;
  role: "owner" | "partner";
  joinedAt: string;
  user: User;
}

export type PlaceCategory =
  | "cafe"
  | "restaurant"
  | "exhibition"
  | "walk"
  | "travel"
  | "shopping"
  | "etc";

export type Priority = "low" | "medium" | "high";

export interface PlaceReaction {
  id: string;
  placeId: string;
  userId: string;
  wantToGo: boolean;
  visited: boolean;
  priority: Priority;
  memo: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlaceComment {
  id: string;
  placeId: string;
  userId: string;
  body: string;
  createdAt: string;
}

export interface Place {
  id: string;
  coupleId: string;
  name: string;
  category: PlaceCategory;
  address: string;
  mapUrl: string;
  latitude: number | null;
  longitude: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** A place plus the couple's reactions (used by list + detail). */
export interface PlaceWithReactions extends Place {
  reactions: PlaceReaction[];
}

export interface PlaceDetail extends Place {
  reactions: PlaceReaction[];
  comments: PlaceComment[];
}

/** Current session: the logged-in user and their couple (if any). */
export interface SessionInfo {
  user: User;
  couple: Couple | null;
  members: CoupleMember[];
}
