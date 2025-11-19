import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useWorlds } from "../../store/worlds";
import { useTheme } from "../../store/theme";

interface Props {
  onClose: () => void;
  onShareWorld: (worldId: string) => void;
  buttonRef?: React.RefObject<HTMLElement>;
}

export function TopbarWorldMenu({ onClose, onShareWorld, buttonRef }: Props) {
  const {
    worlds,
    currentWorldId,
    setWorld,
    createWorld,
    duplicateWorld,
    renameWorld,
    deleteWorld,
  } = useWorlds();
  const { interfaceTheme } = useTheme();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("New World");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);

  useEffect(() => {
    if (buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.right - 320, // 320px is menu width (w-80)
      });
      setIsPositioned(true);
    }
  }, [buttonRef]);

  // Sort worlds by last activity (most recent first)
  const sortedWorlds = [...worlds].sort((a, b) => {
    const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
    const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
    return bTime - aTime;
  });

  return createPortal(
        <div
          className={`fixed w-80 rounded-2xl border shadow-2xl p-2 z-[100] transition-opacity duration-150 ${
            interfaceTheme === "dark"
              ? "border-white/10 bg-[#0a0f1a]"
              : "border-gray-300 bg-white"
          }`}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            opacity: isPositioned ? 1 : 0,
          }}
        >
      <div className={`px-2 py-1 text-[10px] uppercase tracking-wider ${
        interfaceTheme === "dark" ? "text-slate-500" : "text-gray-500"
      }`}>
        Worlds
      </div>
      <div className={`max-h-72 overflow-auto ${
        interfaceTheme === "dark"
          ? "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-white/30"
          : "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-400"
      }`}>
        {sortedWorlds.map((w) => (
          <div
            key={w._id}
            className={`group flex items-center gap-2 px-2 py-2 rounded-xl ${
              interfaceTheme === "dark"
                ? `hover:bg-white/5 ${currentWorldId === w._id ? "bg-white/5" : ""}`
                : `hover:bg-gray-100 ${currentWorldId === w._id ? "bg-gray-100" : ""}`
            }`}
          >
            <button
              className={`flex-1 text-left text-sm truncate ${
                interfaceTheme === "dark" ? "text-slate-100" : "text-gray-900"
              }`}
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
                interfaceTheme={interfaceTheme}
                onRename={async () => {
                  const name = prompt("Rename world", w.name);
                  if (name && name.trim() && name !== w.name)
                    await renameWorld(w._id, name.trim());
                }}
                onDuplicate={async () => {
                  const clone = await duplicateWorld(w._id);
                  if (clone) setWorld(clone._id);
                }}
                onShare={() => onShareWorld(w._id)}
                onDelete={async () => {
                  const confirmDelete = confirm(`Delete "${w.name}"? This removes all pages and cannot be undone.`);
                  console.log("[DELETE] Confirm result:", confirmDelete);
                  if (confirmDelete) {
                    console.log("[DELETE] Attempting to delete world:", w._id);
                    try {
                      await deleteWorld(w._id);
                      console.log("[DELETE] World deleted successfully");
                      onClose(); // Close the main menu after deletion
                    } catch (err) {
                      console.error("[DELETE] Failed to delete world:", err);
                      alert("Failed to delete world. Please try again.");
                    }
                  }
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className={`mt-2 p-2 border-t ${
        interfaceTheme === "dark" ? "border-white/5" : "border-gray-200"
      }`}>
        {creating ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              className={`flex-1 px-3 py-2 rounded-lg border outline-none text-sm ${
                interfaceTheme === "dark"
                  ? "bg-white/5 border-white/10 text-slate-100"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
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
            className={`w-full px-3 py-2 rounded-lg text-sm ${
              interfaceTheme === "dark"
                ? "bg-white/5 hover:bg-white/10 text-slate-100"
                : "bg-gray-100 hover:bg-gray-200 text-gray-900"
            }`}
            onClick={() => setCreating(true)}
          >
            + New world
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

function WorldInlineMenu({
  interfaceTheme,
  onRename,
  onDuplicate,
  onShare,
  onDelete,
}: {
  interfaceTheme: "dark" | "light";
  onRename: () => void;
  onDuplicate: () => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (open && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.right - 176, // 176px is menu width (w-44 = 11rem = 176px)
      });
    }
  }, [open]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    // Add a small delay to prevent immediate closing
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        className={`w-7 h-7 rounded-lg ${
          interfaceTheme === "dark"
            ? "bg-white/5 hover:bg-white/10 text-slate-200"
            : "bg-gray-100 hover:bg-gray-200 text-gray-900"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title="More"
      >
        ⋯
      </button>
      {open && createPortal(
        <div
          className={`fixed w-44 rounded-xl border p-1 shadow-xl z-[110] ${
            interfaceTheme === "dark"
              ? "border-white/10 bg-[#0a0f1a]"
              : "border-gray-300 bg-white"
          }`}
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
          <button
            className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
              interfaceTheme === "dark"
                ? "hover:bg-white/5 text-slate-200"
                : "hover:bg-gray-100 text-gray-900"
            }`}
            onClick={() => {
              onRename();
              setOpen(false);
            }}
          >
            Rename
          </button>
          <button
            className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
              interfaceTheme === "dark"
                ? "hover:bg-white/5 text-slate-200"
                : "hover:bg-gray-100 text-gray-900"
            }`}
            onClick={() => {
              onDuplicate();
              setOpen(false);
            }}
          >
            Duplicate
          </button>
          <button
            className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
              interfaceTheme === "dark"
                ? "hover:bg-white/5 text-slate-200"
                : "hover:bg-gray-100 text-gray-900"
            }`}
            onClick={() => {
              onShare();
              setOpen(false);
            }}
          >
            Share
          </button>
          <button
            className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
              interfaceTheme === "dark"
                ? "hover:bg-red-500/10 text-red-300"
                : "hover:bg-red-100 text-red-700"
            }`}
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
          >
            Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
