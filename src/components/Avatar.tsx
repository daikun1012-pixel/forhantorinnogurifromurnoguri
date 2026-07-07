import type { User } from "@/types";

export function Avatar({ user, size = 32 }: { user: User; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ backgroundColor: user.avatarColor, width: size, height: size, fontSize: size * 0.42 }}
      title={user.name}
    >
      {user.name.slice(0, 1)}
    </span>
  );
}
