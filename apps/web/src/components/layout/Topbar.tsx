// apps/web/src/components/layout/Topbar.tsx
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../store/auth";
import { useWorlds } from "../../store/worlds";
import { useAppStatus } from "../../store/appStatus";
import { TopbarWorldMenu } from "./TopbarWorldMenu";
import { ExportModal } from "../export/ExportModal";
import { ShareWorldModal } from "../sharing/ShareWorldModal";

export function Topbar() {
  const { user, logout } = useAuth();
  const { worlds, currentWorldId, renameWorld } = useWorlds();
  const { isSaving, hasUnsavedChanges, isOffline, lastSavedAt } = useAppStatus();
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
      className="w-full h-20 px-8 flex items-center bg-[#050814]/95 border-b border-white/5 backdrop-blur-xl relative"
      onClick={() => menuOpen && setMenuOpen(false)}
    >
      {/* Left: brand pill */}
      <div className="flex items-center gap-3">
        <div className="h-10 px-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center gap-2 shadow-lg">
          <div className="w-7 h-7 rounded-2xl bg-white/15 flex items-center justify-center text-indigo-100 text-lg font-semibold">
            e
          </div>
          <div className="flex flex-col leading-tight">
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
        <div className="relative flex items-center gap-3 pointer-events-auto">
          {/* World title */}
          <div>
            {editing ? (
              <input
                autoFocus
                className="bg-transparent outline-none border-none text-xl font-semibold text-slate-50 text-center px-3 py-1"
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
                className="text-xl font-semibold text-slate-50 px-3 py-1 rounded-full hover:bg-white/5 transition"
              >
                {currentWorld ? currentWorld.name : "Create your first world"}
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
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-[3px]"
          >
            <span className="w-6 h-[1.5px] bg-slate-200 rounded-full" />
            <span className="w-3 h-[1.5px] bg-slate-200 rounded-full" />
            <span className="w-4 h-[1.5px] bg-slate-200 rounded-full" />
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
      <div className="flex items-center gap-3 text-[10px]">
        <div
          className={
            "px-4 py-1.5 rounded-full border " +
            (isOffline
              ? "bg-red-500/10 border-red-400/60 text-red-300"
              : isSaving
              ? "bg-blue-500/10 border-blue-400/60 text-blue-300"
              : hasUnsavedChanges
              ? "bg-amber-500/10 border-amber-400/60 text-amber-300"
              : "bg-emerald-500/15 border-emerald-400/40 text-emerald-300")
          }
        >
          {isOffline
            ? "Offline"
            : isSaving
            ? "Saving…"
            : hasUnsavedChanges
            ? "Unsaved changes"
            : lastSavedAt
            ? `Saved ${lastSavedAt}`
            : "All changes saved"}
        </div>

        <button
          onClick={() => setShowExport(true)}
          className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-200"
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
            className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-200"
          >
            Sign out
          </button>
        )}
      </div>
    </header>
  );
}
