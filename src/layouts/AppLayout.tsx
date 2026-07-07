import { NavLink, Outlet } from "react-router-dom";
import { useSession } from "@/lib/session";
import { Avatar } from "@/components/ui";

const tabs = [
  { to: "/places", label: "위시리스트", icon: "📋" },
  { to: "/map", label: "지도", icon: "🗺️" },
  { to: "/couple", label: "커플", icon: "💞" },
];

export function AppLayout() {
  const { session } = useSession();

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col bg-cream">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-blush-50 bg-cream/90 px-4 py-3 backdrop-blur">
        <span className="text-lg font-bold text-blush-500">
          우리 데이트 위시리스트
        </span>
        {session && (
          <Avatar
            name={session.user.name}
            color={session.user.avatarColor}
            size={30}
          />
        )}
      </header>

      <main className="flex-1 px-4 py-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t border-blush-50 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="grid grid-cols-3">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition ${
                  isActive ? "text-blush-500" : "text-zinc-400"
                }`
              }
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
