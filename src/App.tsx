import { Navigate, Route, Routes } from "react-router-dom";
import { useSession } from "@/lib/session";
import { AppLayout } from "@/layouts/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { CouplePage } from "@/pages/CouplePage";
import { PlacesPage } from "@/pages/PlacesPage";
import { MapPage } from "@/pages/MapPage";
import { MemoriesPage } from "@/pages/MemoriesPage";
import { Spinner } from "@/components/ui";

export default function App() {
  const { loading, session } = useSession();

  if (loading) {
    return (
      <div className="mx-auto flex min-h-full max-w-md items-center justify-center">
        <Spinner label="불러오는 중…" />
      </div>
    );
  }

  // Not logged in.
  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Logged in but no couple space yet → onboarding.
  if (!session.couple) {
    return (
      <Routes>
        <Route path="/couple" element={<CouplePage />} />
        <Route path="*" element={<Navigate to="/couple" replace />} />
      </Routes>
    );
  }

  // Full app.
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/places" element={<PlacesPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/memories" element={<MemoriesPage />} />
        <Route path="/couple" element={<CouplePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/places" replace />} />
    </Routes>
  );
}
