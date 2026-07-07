import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  comments as mockComments,
  couple as mockCouple,
  members as mockMembers,
  places as mockPlaces,
  reactions as mockReactions,
  users as mockUsers,
} from "@/data/mock";
import type {
  Couple,
  CoupleMember,
  Place,
  PlaceComment,
  PlaceReaction,
  User,
} from "@/types";

interface StoreValue {
  currentUser: User | null;
  users: User[];
  couple: Couple;
  members: CoupleMember[];
  places: Place[];
  reactions: PlaceReaction[];
  comments: PlaceComment[];
  login: (userId: string) => void;
  logout: () => void;
  getUser: (userId: string) => User | undefined;
  reactionsForPlace: (placeId: string) => PlaceReaction[];
  commentsForPlace: (placeId: string) => PlaceComment[];
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const value = useMemo<StoreValue>(() => {
    return {
      currentUser,
      users: mockUsers,
      couple: mockCouple,
      members: mockMembers,
      places: mockPlaces,
      reactions: mockReactions,
      comments: mockComments,
      login: (userId) => {
        const user = mockUsers.find((u) => u.id === userId) ?? null;
        setCurrentUser(user);
      },
      logout: () => setCurrentUser(null),
      getUser: (userId) => mockUsers.find((u) => u.id === userId),
      reactionsForPlace: (placeId) =>
        mockReactions.filter((r) => r.placeId === placeId),
      commentsForPlace: (placeId) =>
        mockComments
          .filter((c) => c.placeId === placeId)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    };
  }, [currentUser]);

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return ctx;
}
