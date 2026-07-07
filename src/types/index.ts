export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
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
}

export type PlaceCategory =
  | "cafe"
  | "restaurant"
  | "activity"
  | "travel"
  | "shopping"
  | "etc";

export interface Place {
  id: string;
  coupleId: string;
  name: string;
  category: PlaceCategory;
  address: string;
  roadAddress: string;
  latitude: number;
  longitude: number;
  sourceUrl: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

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
