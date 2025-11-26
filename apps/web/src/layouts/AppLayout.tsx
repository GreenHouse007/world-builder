import { useEffect } from "react";
import { Outlet } from "@tanstack/react-router";
import { Topbar } from "..//components/layout/Topbar";
import { Sidebar } from "../components/layout/Sidebar";
import { useAuth } from "../store/auth";
import { useWorlds } from "../store/worlds";
import { usePages } from "../store/pages";
import { useTheme } from "../store/theme";
import { AuthOverlay } from "../components/layout/AuthOverlay";
import { BackendStatusBanner } from "../components/layout/BackendStatusBanner";

function LoadingScreen({ theme }: { theme: "light" | "dark" }) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${
      theme === "dark" ? "bg-[#020309] text-slate-300" : "bg-gray-50 text-gray-700"
    }`}>
      <div className={`px-5 py-3 rounded-xl ${
        theme === "dark"
          ? "border border-white/10 bg-white/5"
          : "border border-gray-300 bg-white shadow-lg"
      }`}>
        Loading your worlds…
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { user, loading: authLoading } = useAuth();
  const {
    worlds,
    fetchWorlds,
    currentWorldId,
    setWorld,
    loading: worldsLoading,
  } = useWorlds();
  const { fetchPages } = usePages();
  const { interfaceTheme } = useTheme();

  useEffect(() => {
    if (import.meta.env.DEV) console.log("[APP LAYOUT] user changed:", user);
    if (user) void fetchWorlds();
  }, [user, fetchWorlds]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(
        "[APP LAYOUT] worlds/currentWorldId",
        worlds.map((w) => w.name),
        currentWorldId
      );
    }
    if (!currentWorldId && worlds.length > 0) setWorld(worlds[0]._id);
  }, [worlds, currentWorldId, setWorld]);

  useEffect(() => {
    if (currentWorldId) {
      if (import.meta.env.DEV)
        console.log("[APP LAYOUT] fetch pages for:", currentWorldId);
      void fetchPages(currentWorldId);
    }
  }, [currentWorldId, fetchPages]);

  // Bootstrapping
  if (authLoading || (user && worldsLoading && worlds.length === 0)) {
    return <LoadingScreen theme={interfaceTheme} />;
  }

  return (
    <div className={`min-h-screen flex flex-col ${
      interfaceTheme === "dark"
        ? "bg-[#020309] text-slate-100"
        : "bg-gray-50 text-gray-900"
    }`}>
      <BackendStatusBanner />
      <Topbar />
      <div className="flex flex-1 gap-0 px-2 md:px-4 pb-2 md:pb-4">
        <Sidebar />
        <main className="flex-1 lg:pl-4">
          <Outlet />
        </main>
      </div>
      <AuthOverlay />
    </div>
  );
}
