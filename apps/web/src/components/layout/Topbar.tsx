// apps/web/src/components/layout/Topbar.tsx
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../store/auth";
import { useWorlds } from "../../store/worlds";
import { useAppStatus } from "../../store/appStatus";
import { useTheme } from "../../store/theme";
import { useUI } from "../../store/ui";
import { TopbarWorldMenu } from "./TopbarWorldMenu";
import { ExportModal } from "../export/ExportModal";
import { ShareWorldModal } from "../sharing/ShareWorldModal";

export function Topbar() {
  const { user, logout } = useAuth();
  const { worlds, currentWorldId, renameWorld } = useWorlds();
  const { isSaving, hasUnsavedChanges, isOffline, lastSavedAt } = useAppStatus();
  const { interfaceTheme } = useTheme();
  const { toggleMobileSidebar } = useUI();
  const [showExport, setShowExport] = useState(false);
  const currentWorld = worlds.find((w) => w._id === currentWorldId) ?? null;
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  console.log(
    "[TOPBAR]",
    "\n  worlds:",
    worlds,
    "\n  currentWorldId:",
    currentWorldId,
    "\n  currentWorld:",
    currentWorld
  );

  // Format the saved timestamp
  const formatSavedTime = (isoString: string) => {
    const date = new Date(isoString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(currentWorld?.name ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareWorldId, setShareWorldId] = useState<string | null>(null);

  // Keep the draft name in sync when the current world changes
  useEffect(() => {
    if (!editing) {
      setNameDraft(currentWorld?.name ?? "");
    }
  }, [currentWorld?._id, currentWorld?.name, editing]);

  const handleWorldNameClick = () => {
    if (!currentWorld) return;
    setNameDraft(currentWorld.name);
    setEditing(true);
  };

  const commitRename = async () => {
    if (!currentWorld) {
      setEditing(false);
      return;
    }
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== currentWorld.name) {
      await renameWorld(currentWorld._id, trimmed);
    }
    setEditing(false);
  };

  return (
    <header
      className={`w-full h-16 md:h-20 px-3 md:px-8 flex items-center backdrop-blur-xl relative border-b ${
        interfaceTheme === "dark"
          ? "bg-[#050814]/95 border-white/5"
          : "bg-white/95 border-gray-200 shadow-sm"
      }`}
      onClick={() => menuOpen && setMenuOpen(false)}
    >
      {/* Left: hamburger menu (mobile) + brand pill */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile menu button */}
        <button
          onClick={toggleMobileSidebar}
          className={`lg:hidden w-9 h-9 flex items-center justify-center rounded-lg ${
            interfaceTheme === "dark"
              ? "hover:bg-white/10"
              : "hover:bg-gray-100"
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {/* Brand - hide text on mobile */}
        <div className="h-9 md:h-10 px-3 md:px-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center gap-2 shadow-lg">
          <div className="w-6 h-6 md:w-7 md:h-7 rounded-2xl bg-white/15 flex items-center justify-center text-indigo-100 text-base md:text-lg font-semibold">
            e
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-[9px] tracking-[0.22em] uppercase text-indigo-100/70">
              Enfield
            </span>
            <span className="text-sm font-semibold text-slate-50">
              World Builder
            </span>
          </div>
        </div>
      </div>

      {/* Center: world title + hamburger */}
      <div className="flex-1 flex items-center justify-center pointer-events-none">
        <div className="relative flex items-center gap-2 md:gap-3 pointer-events-auto">
          {/* World title */}
          <div className="max-w-[150px] md:max-w-none">
            {editing ? (
              <input
                autoFocus
                className={`bg-transparent outline-none border-none text-base md:text-xl font-semibold text-center px-2 md:px-3 py-1 w-full ${
                  interfaceTheme === "dark" ? "text-slate-50" : "text-gray-900"
                }`}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitRename();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setEditing(false);
                    setNameDraft(currentWorld?.name ?? "");
                  }
                }}
                placeholder="Name your world"
              />
            ) : (
              <button
                type="button"
                onClick={handleWorldNameClick}
                className={`text-base md:text-xl font-semibold px-2 md:px-3 py-1 rounded-full transition truncate ${
                  interfaceTheme === "dark"
                    ? "text-slate-50 hover:bg-white/5"
                    : "text-gray-900 hover:bg-gray-100"
                }`}
                title={currentWorld ? currentWorld.name : "Create your first world"}
              >
                {currentWorld ? currentWorld.name : "Create world"}
              </button>
            )}
          </div>

          {/* Worlds hamburger */}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className={`w-9 h-9 rounded-full flex flex-col items-center justify-center gap-[3px] ${
              interfaceTheme === "dark"
                ? "bg-white/5 hover:bg-white/10"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <span className={`w-6 h-[1.5px] rounded-full ${
              interfaceTheme === "dark" ? "bg-slate-200" : "bg-gray-700"
            }`} />
            <span className={`w-3 h-[1.5px] rounded-full ${
              interfaceTheme === "dark" ? "bg-slate-200" : "bg-gray-700"
            }`} />
            <span className={`w-4 h-[1.5px] rounded-full ${
              interfaceTheme === "dark" ? "bg-slate-200" : "bg-gray-700"
            }`} />
          </button>

          {/* Worlds menu */}
          {menuOpen && (
            <TopbarWorldMenu
              onClose={() => setMenuOpen(false)}
              onShareWorld={(worldId) => setShareWorldId(worldId)}
              buttonRef={menuButtonRef}
            />
          )}
        </div>
      </div>

      {/* Right: save indicator + sign out */}
      <div className="flex items-center gap-2 md:gap-3 text-[10px]">
        {/* Save status - show shorter text on mobile */}
        <div
          className={
            "px-2 md:px-4 py-1.5 rounded-full border text-[9px] md:text-[10px] " +
            (isOffline
              ? interfaceTheme === "dark"
                ? "bg-red-500/10 border-red-400/60 text-red-300"
                : "bg-red-100 border-red-400 text-red-700"
              : isSaving
              ? interfaceTheme === "dark"
                ? "bg-blue-500/10 border-blue-400/60 text-blue-300"
                : "bg-blue-100 border-blue-400 text-blue-700"
              : hasUnsavedChanges
              ? interfaceTheme === "dark"
                ? "bg-amber-500/10 border-amber-400/60 text-amber-300"
                : "bg-amber-100 border-amber-400 text-amber-700"
              : interfaceTheme === "dark"
              ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300"
              : "bg-emerald-100 border-emerald-400 text-emerald-700")
          }
        >
          <span className="hidden md:inline">
            {isOffline
              ? "Offline"
              : isSaving
              ? "Saving…"
              : hasUnsavedChanges
              ? "Unsaved changes"
              : lastSavedAt
              ? `Saved ${formatSavedTime(lastSavedAt)}`
              : "All changes saved"}
          </span>
          <span className="md:hidden">
            {isOffline ? "○" : isSaving ? "•••" : hasUnsavedChanges ? "●" : "✓"}
          </span>
        </div>

        <button
          onClick={() => setShowExport(true)}
          className={`hidden sm:block px-3 md:px-4 py-1.5 rounded-full ${
            interfaceTheme === "dark"
              ? "bg-white/5 hover:bg-white/10 text-slate-200"
              : "bg-gray-100 hover:bg-gray-200 text-gray-900"
          }`}
        >
          Export
        </button>
        {showExport && <ExportModal onClose={() => setShowExport(false)} />}

        {/* Share World Modal */}
        {shareWorldId && (() => {
          const shareWorld = worlds.find(w => w._id === shareWorldId);
          return shareWorld ? (
            <ShareWorldModal
              worldId={shareWorldId}
              worldName={shareWorld.name}
              onClose={() => setShareWorldId(null)}
            />
          ) : null;
        })()}

        {user && (
          <button
            onClick={logout}
            className={`hidden md:block px-3 md:px-4 py-1.5 rounded-full ${
              interfaceTheme === "dark"
                ? "bg-white/5 hover:bg-white/10 text-slate-200"
                : "bg-gray-100 hover:bg-gray-200 text-gray-900"
            }`}
          >
            Sign out
          </button>
        )}
      </div>
    </header>
  );
}
