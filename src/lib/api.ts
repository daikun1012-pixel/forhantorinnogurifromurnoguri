import type {
  Couple,
  Place,
  PlaceComment,
  PlaceDetail,
  PlaceReaction,
  PlaceWithReactions,
  SessionInfo,
  User,
  Visit,
  VisitWithPlace,
} from "@/types";

export interface AppConfig {
  naverMapClientId: string;
  naverMapKeyParam: string;
  searchEnabled: boolean;
  vapidPublicKey: string;
  pushEnabled: boolean;
  photosEnabled: boolean;
}

export interface SearchResult {
  name: string;
  category: string;
  naverCategory: string;
  address: string;
  mapUrl: string;
  latitude: number | null;
  longitude: number | null;
}

const USER_KEY = "cdw_user_id";

export function getStoredUserId(): string | null {
  return localStorage.getItem(USER_KEY);
}

/** URL to display a visit photo (public by unguessable id). */
export function photoUrl(id: string): string {
  return `/api/photos/${id}`;
}
export function setStoredUserId(id: string | null): void {
  if (id) localStorage.setItem(USER_KEY, id);
  else localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function req<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  const userId = getStoredUserId();
  if (userId) headers["X-User-Id"] = userId;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`/api${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let json: { ok: boolean; data?: T; error?: string };
  try {
    json = await res.json();
  } catch {
    throw new ApiError("서버 응답을 읽을 수 없습니다", res.status);
  }
  if (!res.ok || !json.ok) {
    throw new ApiError(json.error ?? "요청에 실패했습니다", res.status);
  }
  return json.data as T;
}

export const api = {
  login: (name: string) =>
    req<User>("/auth/login", { method: "POST", body: { name } }),
  me: () => req<SessionInfo>("/me"),

  createCouple: (name?: string) =>
    req<Couple>("/couples", { method: "POST", body: { name } }),
  joinCouple: (code: string) =>
    req<Couple>("/couples/join", { method: "POST", body: { code } }),
  kickMember: (userId: string) =>
    req<{ removed: string }>(`/couples/members/${userId}`, {
      method: "DELETE",
    }),

  pushSubscribe: (sub: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }) => req<{ subscribed: boolean }>("/push/subscribe", { method: "POST", body: sub }),
  pushUnsubscribe: (endpoint: string) =>
    req<{ unsubscribed: boolean }>("/push/unsubscribe", {
      method: "POST",
      body: { endpoint },
    }),
  pushTest: () =>
    req<{
      subscriptions: number;
      outcomes: { endpoint: string; status: number; ok: boolean; error?: string }[];
      selfCheck: {
        signatureValid: boolean;
        subject: string;
        publicKeyLength: number;
        privateKeyLength: number;
      };
    }>("/push/test", { method: "POST" }),

  getConfig: () => req<AppConfig>("/config"),
  search: (query: string) =>
    req<SearchResult[]>(`/search?query=${encodeURIComponent(query)}`),

  listPlaces: () => req<PlaceWithReactions[]>("/places"),
  createPlace: (input: {
    name: string;
    category: string;
    address?: string;
    mapUrl?: string;
    latitude?: number | null;
    longitude?: number | null;
  }) =>
    req<PlaceWithReactions & { duplicate: boolean }>("/places", {
      method: "POST",
      body: input,
    }),
  getPlace: (id: string) => req<PlaceDetail>(`/places/${id}`),
  updatePlace: (
    id: string,
    input: {
      name?: string;
      category?: string;
      address?: string;
      mapUrl?: string;
    },
  ) => req<Place>(`/places/${id}`, { method: "PATCH", body: input }),
  deletePlace: (id: string) =>
    req<{ id: string }>(`/places/${id}`, { method: "DELETE" }),

  setReaction: (
    placeId: string,
    input: {
      wantToGo: boolean;
      visited: boolean;
      priority: string;
      memo: string;
    },
  ) =>
    req<PlaceReaction>(`/places/${placeId}/reaction`, {
      method: "PUT",
      body: input,
    }),

  listVisits: () => req<VisitWithPlace[]>("/visits"),
  addVisit: (placeId: string, input: { visitedAt: string; note: string }) =>
    req<Visit>(`/places/${placeId}/visits`, { method: "POST", body: input }),
  deleteVisit: (visitId: string) =>
    req<{ id: string }>(`/visits/${visitId}`, { method: "DELETE" }),
  uploadVisitPhoto: async (visitId: string, blob: Blob) => {
    const headers: Record<string, string> = { "Content-Type": blob.type };
    const userId = getStoredUserId();
    if (userId) headers["X-User-Id"] = userId;
    const res = await fetch(`/api/visits/${visitId}/photos`, {
      method: "POST",
      headers,
      body: blob,
    });
    const json = await res.json().catch(() => ({ ok: false }));
    if (!res.ok || !json.ok) {
      throw new ApiError(json.error ?? "업로드 실패", res.status);
    }
    return json.data as { id: string };
  },
  deletePhoto: (photoId: string) =>
    req<{ id: string }>(`/photos/${photoId}`, { method: "DELETE" }),

  addComment: (placeId: string, body: string) =>
    req<PlaceComment>(`/places/${placeId}/comments`, {
      method: "POST",
      body: { body },
    }),
  deleteComment: (commentId: string) =>
    req<{ id: string }>(`/comments/${commentId}`, { method: "DELETE" }),
};
