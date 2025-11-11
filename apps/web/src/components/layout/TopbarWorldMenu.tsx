// apps/web/src/components/layout/TopbarWorldMenu.tsx
import { useWorlds } from "../../store/worlds";
import { usePages } from "../../store/pages";
import type { MouseEvent } from "react";

interface TopbarWorldMenuProps {
  onClose: () => void;
}

export function TopbarWorldMenu({ onClose }: TopbarWorldMenuProps) {
  const {
    worlds,
    currentWorldId,
    setWorld,
    createWorld,
    renameWorld,
    deleteWorld,
    duplicateWorld,
  } = useWorlds();
  const { setCurrentPage } = usePages();

  const handleSelectWorld = (id: string) => {
    setWorld(id);
    setCurrentPage(null);
    onClose();
  };

  const handleNewWorld = async () => {
    const name = window.prompt("Name your new world");
    if (!name || !name.trim()) return;
    await createWorld(name.trim(), "🌌");
    onClose();
  };

  const stop = (e: MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div onClick={stop}>
      <div className="w-64 rounded-3xl bg-[#050814] border border-white/10 shadow-2xl py-2 px-2 text-[10px] text-slate-200">
        <div className="px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-slate-500">
          Worlds / Indexes
        </div>
        <div className="max-h-72 overflow-y-auto space-y-1">
          {worlds.map((w) => (
            <div
              key={w._id}
              className={`group flex items-center gap-2 px-2 py-1.5 rounded-2xl cursor-pointer ${
                w._id === currentWorldId
                  ? "bg-indigo-500/20 text-indigo-200"
                  : "hover:bg-white/5 text-slate-200"
              }`}
              onClick={() => handleSelectWorld(w._id)}
            >
              <span className="text-lg">{w.emoji ?? "🌌"}</span>
              <span className="truncate flex-1 text-[10px]">{w.name}</span>
              <button
                className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-[12px] text-slate-400"
                onClick={(e) => {
                  e.stopPropagation();
                  const action = window.prompt(
                    `Actions for "${w.name}":\n- rename\n- duplicate\n- delete\n- share`,
                    "rename"
                  );
                  if (!action) return;

                  if (action === "rename") {
                    const next = window.prompt("New name:", w.name);
                    if (next && next.trim()) {
                      renameWorld(w._id, next.trim());
                    }
                  } else if (action === "duplicate") {
                    duplicateWorld(w._id);
                  } else if (action === "delete") {
                    if (
                      window.confirm(
                        `Delete world "${w.name}" and all its pages?`
                      )
                    ) {
                      deleteWorld(w._id);
                    }
                  } else if (action === "share") {
                    window.alert("Sharing coming soon.");
                  }
                }}
              >
                ⋯
              </button>
            </div>
          ))}

          {worlds.length === 0 && (
            <div className="px-2 py-2 text-slate-500">
              No worlds yet. Create one below.
            </div>
          )}
        </div>

        <button
          className="mt-2 w-full px-3 py-1.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-[10px] text-white font-medium"
          onClick={handleNewWorld}
        >
          + New world / index
        </button>
      </div>
    </div>
  );
}
