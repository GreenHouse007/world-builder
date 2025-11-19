import { useState } from "react";
import type { Editor } from "@tiptap/react";

interface ImageContextMenuProps {
  editor: Editor;
  x: number;
  y: number;
  onClose: () => void;
}

export function ImageContextMenu({ editor, x, y, onClose }: ImageContextMenuProps) {
  const [showAlignMenu, setShowAlignMenu] = useState(false);

  const MenuItem = ({
    label,
    onClick,
    submenu,
  }: {
    label: string;
    onClick?: () => void;
    submenu?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-3 py-2 hover:bg-white/10 text-sm text-slate-300 flex items-center justify-between"
    >
      <span>{label}</span>
      {submenu && <span className="text-xs">▶</span>}
    </button>
  );

  return (
    <>
      {/* Backdrop to close menu */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Context Menu */}
      <div
        className="fixed bg-[#0a0f1a] border border-white/10 rounded-lg shadow-xl z-50 min-w-[200px]"
        style={{ top: y, left: x }}
      >
        {!showAlignMenu ? (
          <>
            <MenuItem
              label="Align Image"
              onClick={() => setShowAlignMenu(true)}
              submenu
            />
            <div className="h-px bg-white/10 my-1" />
            <MenuItem
              label="Delete Image"
              onClick={() => {
                editor.chain().focus().deleteSelection().run();
                onClose();
              }}
            />
          </>
        ) : (
          <>
            <div className="p-2 border-b border-white/10">
              <button
                type="button"
                onClick={() => setShowAlignMenu(false)}
                className="text-xs text-slate-400 hover:text-slate-300"
              >
                ← Back
              </button>
            </div>
            <MenuItem
              label="Left"
              onClick={() => {
                editor.chain().focus().setImageAlign("left").run();
                onClose();
              }}
            />
            <MenuItem
              label="Center"
              onClick={() => {
                editor.chain().focus().setImageAlign("center").run();
                onClose();
              }}
            />
            <MenuItem
              label="Right"
              onClick={() => {
                editor.chain().focus().setImageAlign("right").run();
                onClose();
              }}
            />
            <div className="h-px bg-white/10 my-1" />
            <MenuItem
              label="Wrap Right (Float Left)"
              onClick={() => {
                editor.chain().focus().setImageFloat("left").run();
                onClose();
              }}
            />
            <MenuItem
              label="Wrap Left (Float Right)"
              onClick={() => {
                editor.chain().focus().setImageFloat("right").run();
                onClose();
              }}
            />
          </>
        )}
      </div>
    </>
  );
}
