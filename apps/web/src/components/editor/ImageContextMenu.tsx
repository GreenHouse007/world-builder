import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { useTheme } from "../../store/theme";

interface ImageContextMenuProps {
  editor: Editor;
  x: number;
  y: number;
  onClose: () => void;
}

export function ImageContextMenu({ editor, x, y, onClose }: ImageContextMenuProps) {
  const { editorTheme } = useTheme();
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
      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between ${
        editorTheme === "dark"
          ? "hover:bg-white/10 text-slate-300"
          : "hover:bg-gray-100 text-gray-900"
      }`}
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
        className={`fixed rounded-lg shadow-xl z-50 min-w-[200px] ${
          editorTheme === "dark"
            ? "bg-[#0a0f1a] border border-white/10"
            : "bg-white border border-gray-300"
        }`}
        style={{ top: y, left: x }}
      >
        {!showAlignMenu ? (
          <>
            <MenuItem
              label="Align Image"
              onClick={() => setShowAlignMenu(true)}
              submenu
            />
            <div className={`h-px my-1 ${
              editorTheme === "dark" ? "bg-white/10" : "bg-gray-200"
            }`} />
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
            <div className={`p-2 border-b ${
              editorTheme === "dark" ? "border-white/10" : "border-gray-200"
            }`}>
              <button
                type="button"
                onClick={() => setShowAlignMenu(false)}
                className={`text-xs ${
                  editorTheme === "dark"
                    ? "text-slate-400 hover:text-slate-300"
                    : "text-gray-600 hover:text-gray-900"
                }`}
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
            <div className={`h-px my-1 ${
              editorTheme === "dark" ? "bg-white/10" : "bg-gray-200"
            }`} />
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
