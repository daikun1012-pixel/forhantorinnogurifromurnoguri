import { Navigate, Route, Routes } from "react-router-dom";
import { useStore } from "@/lib/store";
import { AppLayout } from "@/layouts/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { InvitePage } from "@/pages/InvitePage";
import { PlacesPage } from "@/pages/PlacesPage";
import { MapPage } from "@/pages/MapPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { currentUser } = useStore();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/places" element={<PlacesPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/invite" element={<InvitePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/places" replace />} />
    </Routes>
  );
}
