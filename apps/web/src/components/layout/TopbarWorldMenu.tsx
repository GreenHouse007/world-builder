import { useState } from "react";
import { useWorlds } from "../../store/worlds";

interface Props {
  onClose: () => void;
}

export function TopbarWorldMenu({ onClose }: Props) {
  const {
    worlds,
    currentWorldId,
    setWorld,
    createWorld,
    renameWorld,
    deleteWorld,
  } = useWorlds();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("New World");

  return (
    <div className="w-80 rounded-2xl border border-white/10 bg-[#0a0f1a] shadow-2xl p-2">
      <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500">
        Worlds
      </div>
      <div className="max-h-72 overflow-auto">
        {worlds.map((w) => (
          <div
            key={w._id}
            className={`group flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-white/5 ${
              currentWorldId === w._id ? "bg-white/5" : ""
            }`}
          >
            <button
              className="flex-1 text-left text-sm text-slate-100 truncate"
              onClick={() => {
                setWorld(w._id);
                onClose();
              }}
              title={w.name}
            >
              {w.emoji ?? "🌍"} {w.name}
            </button>
            {/* inline 3-dots per world */}
            <div className="opacity-0 group-hover:opacity-100 transition">
              <WorldInlineMenu
                onRename={async () => {
                  const name = prompt("Rename world", w.name);
                  if (name && name.trim() && name !== w.name)
                    await renameWorld(w._id, name.trim());
                }}
                onDuplicate={async () => {
                  const clone = await createWorld(`${w.name} (Copy)`, w.emoji);
                  if (clone) setWorld(clone._id);
                }}
                onShare={() => alert("Sharing UI TBD")}
                onDelete={async () => {
                  if (confirm("Delete this world? This removes all pages."))
                    await deleteWorld(w._id);
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 p-2 border-t border-white/5">
        {creating ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 outline-none text-sm text-slate-100"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  const w = await createWorld(
                    draft.trim() || "New World",
                    "🌍"
                  );
                  if (w) setWorld(w._id);
                  setCreating(false);
                  onClose();
                }
                if (e.key === "Escape") setCreating(false);
              }}
            />
            <button
              className="px-3 py-2 rounded-lg bg-indigo-500 text-white text-sm"
              onClick={async () => {
                const w = await createWorld(draft.trim() || "New World", "🌍");
                if (w) setWorld(w._id);
                setCreating(false);
                onClose();
              }}
            >
              Create
            </button>
          </div>
        ) : (
          <button
            className="w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-slate-100"
            onClick={() => setCreating(true)}
          >
            + New world
          </button>
        )}
      </div>
    </div>
  );
}

function WorldInlineMenu({
  onRename,
  onDuplicate,
  onShare,
  onDelete,
}: {
  onRename: () => void;
  onDuplicate: () => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200"
        onClick={() => setOpen((v) => !v)}
        title="More"
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-44 rounded-xl border border-white/10 bg-[#0a0f1a] p-1 shadow-xl z-50">
          <button
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm"
            onClick={() => {
              onRename();
              setOpen(false);
            }}
          >
            Rename
          </button>
          <button
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm"
            onClick={() => {
              onDuplicate();
              setOpen(false);
            }}
          >
            Duplicate
          </button>
          <button
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm"
            onClick={() => {
              onShare();
              setOpen(false);
            }}
          >
            Share
          </button>
          <button
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-300 text-sm"
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
