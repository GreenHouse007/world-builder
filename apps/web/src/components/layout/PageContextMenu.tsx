import { useEffect, useRef } from "react";

interface Props {
  x: number;
  y: number;
  interfaceTheme: "dark" | "light";
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function PageContextMenu({
  x,
  y,
  interfaceTheme,
  onRename,
  onDuplicate,
  onDelete,
  onClose,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{ top: y, left: x }}
      className={`fixed z-[200] min-w-40 rounded-xl border shadow-2xl p-1 ${
        interfaceTheme === "dark"
          ? "border-white/10 bg-[#0a0f1a]"
          : "border-gray-300 bg-white"
      }`}
    >
      <button
        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
          interfaceTheme === "dark"
            ? "hover:bg-white/5 text-slate-200"
            : "hover:bg-gray-100 text-gray-900"
        }`}
        onClick={() => {
          onRename();
          onClose();
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
          onClose();
        }}
      >
        Duplicate
      </button>
      <button
        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
          interfaceTheme === "dark"
            ? "hover:bg-red-500/10 text-red-300"
            : "hover:bg-red-100 text-red-700"
        }`}
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        Delete
      </button>
    </div>
  );
}
