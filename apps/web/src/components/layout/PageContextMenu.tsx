import type { FC } from "react";

interface PageContextMenuProps {
  x: number;
  y: number;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const PageContextMenu: FC<PageContextMenuProps> = ({
  x,
  y,
  onDuplicate,
  onDelete,
  onClose,
}) => {
  return (
    <div
      className="fixed z-50"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-40 rounded-2xl bg-[#050814] border border-white/10 shadow-2xl py-1 text-[10px] text-slate-200">
        <button
          className="w-full px-3 py-1.5 text-left hover:bg-white/5"
          onClick={() => {
            onDuplicate();
            onClose();
          }}
        >
          Duplicate page
        </button>
        <button
          className="w-full px-3 py-1.5 text-left text-red-300 hover:bg-red-500/10"
          onClick={() => {
            if (window.confirm("Delete this page and its children?")) {
              onDelete();
              onClose();
            }
          }}
        >
          Delete page
        </button>
      </div>
    </div>
  );
};
