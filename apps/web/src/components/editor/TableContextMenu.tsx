import { useState } from "react";
import type { Editor } from "@tiptap/react";

interface TableContextMenuProps {
  editor: Editor;
  x: number;
  y: number;
  onClose: () => void;
}

export function TableContextMenu({ editor, x, y, onClose }: TableContextMenuProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colors = [
    { name: "None", value: "transparent" },
    { name: "Light Gray", value: "#f3f4f6" },
    { name: "Gray", value: "#d1d5db" },
    { name: "Red", value: "#fecaca" },
    { name: "Orange", value: "#fed7aa" },
    { name: "Yellow", value: "#fef3c7" },
    { name: "Green", value: "#d9f99d" },
    { name: "Blue", value: "#bfdbfe" },
    { name: "Purple", value: "#e9d5ff" },
    { name: "Pink", value: "#fbcfe8" },
  ];

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
        {!showColorPicker ? (
          <>
            <MenuItem
              label="Add Row Above"
              onClick={() => {
                editor.chain().focus().addRowBefore().run();
                onClose();
              }}
            />
            <MenuItem
              label="Add Row Below"
              onClick={() => {
                editor.chain().focus().addRowAfter().run();
                onClose();
              }}
            />
            <div className="h-px bg-white/10 my-1" />
            <MenuItem
              label="Add Column Left"
              onClick={() => {
                editor.chain().focus().addColumnBefore().run();
                onClose();
              }}
            />
            <MenuItem
              label="Add Column Right"
              onClick={() => {
                editor.chain().focus().addColumnAfter().run();
                onClose();
              }}
            />
            <div className="h-px bg-white/10 my-1" />
            <MenuItem
              label="Delete Row"
              onClick={() => {
                editor.chain().focus().deleteRow().run();
                onClose();
              }}
            />
            <MenuItem
              label="Delete Column"
              onClick={() => {
                editor.chain().focus().deleteColumn().run();
                onClose();
              }}
            />
            <MenuItem
              label="Delete Table"
              onClick={() => {
                editor.chain().focus().deleteTable().run();
                onClose();
              }}
            />
            <div className="h-px bg-white/10 my-1" />
            <MenuItem
              label="Cell Background Color"
              onClick={() => setShowColorPicker(true)}
              submenu
            />
          </>
        ) : (
          <>
            <div className="p-2 border-b border-white/10">
              <button
                type="button"
                onClick={() => setShowColorPicker(false)}
                className="text-xs text-slate-400 hover:text-slate-300"
              >
                ← Back
              </button>
            </div>
            <div className="p-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setCellAttribute("backgroundColor", color.value).run();
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 text-sm text-slate-300 flex items-center gap-2"
                >
                  <div
                    className="w-4 h-4 rounded border border-white/20"
                    style={{ backgroundColor: color.value }}
                  />
                  {color.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
