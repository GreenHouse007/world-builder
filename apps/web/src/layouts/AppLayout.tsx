import { Outlet } from "@tanstack/react-router";
import { Topbar } from "../components/layout/Topbar";
import { Sidebar } from "../components/layout/Sidebar";
import { AuthOverlay } from "../components/layout/AuthOverlay";

function AppLayout() {
  return (
    <div className="min-h-screen bg-[#020309] text-slate-100 flex flex-col">
      {/* Topbar spans full width */}
      <Topbar />

      {/* Main area: sidebar + routed content */}
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Lazy login overlay */}
      <AuthOverlay />
    </div>
  );
}

export default AppLayout;
