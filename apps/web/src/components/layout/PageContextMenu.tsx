import { useEffect, useRef } from "react";

interface Props {
  x: number;
  y: number;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function PageContextMenu({
  x,
  y,
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
      className="fixed z-50 min-w-40 rounded-xl border border-white/10 bg-[#0a0f1a] shadow-2xl p-1"
    >
      <button
        className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm"
        onClick={() => {
          onRename();
          onClose();
        }}
      >
        Rename
      </button>
      <button
        className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm"
        onClick={() => {
          onDuplicate();
          onClose();
        }}
      >
        Duplicate
      </button>
      <button
        className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/10 text-sm text-red-300"
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
