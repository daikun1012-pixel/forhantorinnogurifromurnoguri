import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/Avatar";

const tabs = [
  { to: "/places", label: "위시리스트", icon: "📋" },
  { to: "/map", label: "지도", icon: "🗺️" },
  { to: "/invite", label: "커플", icon: "💞" },
];

export function AppLayout() {
  const { currentUser, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col bg-cream">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-blush-50 bg-cream/90 px-4 py-3 backdrop-blur">
        <span className="text-lg font-bold text-blush-500">우리의 위시리스트</span>
        {currentUser && (
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2"
            title="로그아웃"
          >
            <Avatar user={currentUser} size={30} />
          </button>
        )}
      </header>

      <main className="flex-1 px-4 py-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t border-blush-50 bg-white/95 backdrop-blur">
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
