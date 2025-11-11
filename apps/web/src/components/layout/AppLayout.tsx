import { Outlet } from "@tanstack/react-router";
import { Topbar } from "../../components/layout/Topbar";
import { Sidebar } from "../../components/layout/Sidebar";
import { AuthOverlay } from "../../components/layout/AuthOverlay";
import { useEffect } from "react";
import { useAuth } from "../../store/auth";
import { useWorlds } from "../../store/worlds";
import { usePages } from "../../store/pages";

function AppLayout() {
  const { user } = useAuth();
  const { currentWorldId, fetchWorlds } = useWorlds();
  const { fetchPages } = usePages();

  useEffect(() => {
    if (user) {
      fetchWorlds();
    }
  }, [user, fetchWorlds]);

  useEffect(() => {
    if (currentWorldId) {
      fetchPages(currentWorldId);
    }
  }, [currentWorldId, fetchPages]);

  return (
    <div className="min-h-screen bg-[#020309] text-slate-100 flex flex-col">
      <Topbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <AuthOverlay />
    </div>
  );
}

export default AppLayout;
