import { useRef } from "react";
import type { Editor } from "@tiptap/react";
import { uploadImage } from "../../lib/imageUpload";

interface EditorContextMenuProps {
  editor: Editor;
  x: number;
  y: number;
  onClose: () => void;
}

export function EditorContextMenu({ editor, x, y, onClose }: EditorContextMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const imageFile = files[0];
    if (!imageFile.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    try {
      const url = await uploadImage(imageFile);
      editor
        .chain()
        .focus()
        .setImage({ src: url, alt: imageFile.name })
        .updateAttributes("resizableImage", { height: "300px" })
        .run();
      onClose();
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image");
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const MenuItem = ({
    label,
    onClick,
  }: {
    label: string;
    onClick?: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-3 py-2 hover:bg-white/10 text-sm text-slate-300 flex items-center justify-between"
    >
      <span>{label}</span>
    </button>
  );

  const handleCopy = () => {
    document.execCommand('copy');
    onClose();
  };

  const handleCut = () => {
    document.execCommand('cut');
    onClose();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      editor.chain().focus().insertContent(text).run();
      onClose();
    } catch (err) {
      // Fallback to execCommand if clipboard API is not available
      document.execCommand('paste');
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop to close menu */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Context Menu */}
      <div
        className="fixed bg-[#0a0f1a] border border-white/10 rounded-lg shadow-xl z-50 min-w-[200px]"
        style={{ top: y, left: x }}
      >
        <MenuItem label="Copy" onClick={handleCopy} />
        <MenuItem label="Cut" onClick={handleCut} />
        <MenuItem label="Paste" onClick={handlePaste} />
        <div className="h-px bg-white/10 my-1" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />
        <MenuItem
          label="Insert Image"
          onClick={() => fileInputRef.current?.click()}
        />
      </div>
    </>
  );
}
