import { useState, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { TableInsertModal } from "./TableInsertModal";
import { uploadImage } from "../../lib/imageUpload";
import { useTheme } from "../../store/theme";
import { getColorPickerColors } from "../../lib/colorPalette";

export function EditorToolbar({ editor }: { editor: Editor | null }) {
  const { editorTheme } = useTheme();
  const [showTableModal, setShowTableModal] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
  const [showAlignMenu, setShowAlignMenu] = useState(false);
  const [showSpacingMenu, setShowSpacingMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showImageAlignMenu, setShowImageAlignMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

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
      editor.chain().focus().setImage({ src: url, alt: imageFile.name }).run();
      // Update the image attributes to set default height
      const { state } = editor;
      const { selection } = state;
      editor.chain().focus().updateAttributes("resizableImage", { height: "300px" }).run();
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image");
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fonts = [
    { name: "Default", value: "" },
    { name: "Arial", value: "Arial, sans-serif" },
    { name: "Times New Roman", value: "'Times New Roman', serif" },
    { name: "Courier New", value: "'Courier New', monospace" },
    { name: "Georgia", value: "Georgia, serif" },
    { name: "Verdana", value: "Verdana, sans-serif" },
    { name: "Comic Sans MS", value: "'Comic Sans MS', cursive" },
  ];

  const fontSizes = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "36px"];

  // Get theme-aware colors for the color picker
  const colors = getColorPickerColors(editorTheme);

  const lineHeights = [
    { name: "Single", value: "1" },
    { name: "1.15", value: "1.15" },
    { name: "1.5", value: "1.5" },
    { name: "Double", value: "2" },
  ];

  // Get current values from editor
  const getCurrentFont = () => {
    const fontFamily = editor.getAttributes("textStyle").fontFamily;
    if (!fontFamily) return "Default";
    const found = fonts.find((f) => f.value === fontFamily);
    return found ? found.name : "Default";
  };

  const getCurrentFontSize = () => {
    const fontSize = editor.getAttributes("textStyle").fontSize;
    return fontSize || "16px";
  };

  const getCurrentColor = () => {
    const color = editor.getAttributes("textStyle").color;
    return color || "#FFFFFF";
  };

  const getCurrentHighlight = () => {
    const highlight = editor.getAttributes("highlight").color;
    return highlight || "None";
  };

  const getCurrentAlign = () => {
    if (editor.isActive({ textAlign: "left" })) return "Left";
    if (editor.isActive({ textAlign: "center" })) return "Center";
    if (editor.isActive({ textAlign: "right" })) return "Right";
    return "Left";
  };

  const getCurrentLineHeight = () => {
    // Try to get line height from paragraph first, then heading
    let lineHeight = editor.getAttributes("paragraph").lineHeight;
    if (!lineHeight) {
      lineHeight = editor.getAttributes("heading").lineHeight;
    }
    if (!lineHeight) return "Single";
    const found = lineHeights.find((lh) => lh.value === lineHeight);
    return found ? found.name : "Single";
  };

  const isImageSelected = () => {
    return editor.isActive("resizableImage");
  };

  const getCurrentImageAlign = () => {
    const attrs = editor.getAttributes("resizableImage");
    if (attrs.float === "left") return "Wrap Right";
    if (attrs.float === "right") return "Wrap Left";
    if (attrs.align === "center") return "Center";
    if (attrs.align === "right") return "Right";
    return "Left";
  };

  const Btn = ({
    active,
    onClick,
    label,
    title,
    icon,
  }: {
    active?: boolean;
    onClick: () => void;
    label?: string;
    title?: string;
    icon?: string;
  }) => (
    <button
      type="button"
      title={title || label}
      onClick={onClick}
      className={
        "px-2.5 py-1.5 rounded-lg text-sm transition-colors " +
        (active
          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
          : editorTheme === "dark"
          ? "bg-white/5 hover:bg-white/10 text-slate-300 border border-transparent"
          : "bg-gray-100 hover:bg-gray-200 text-gray-900 border border-transparent")
      }
    >
      {icon || label}
    </button>
  );

  const Dropdown = ({
    topLabel,
    currentValue,
    isOpen,
    onToggle,
    children,
  }: {
    topLabel?: string;
    currentValue: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }) => (
    <div className="relative flex flex-col">
      {topLabel && (
        <span className={`text-[10px] mb-0.5 px-1 ${
          editorTheme === "dark" ? "text-slate-400" : "text-gray-600"
        }`}>{topLabel}</span>
      )}
      <button
        type="button"
        onClick={onToggle}
        className={`px-3 py-1.5 rounded-lg text-sm border border-transparent transition-colors flex items-center gap-1 min-w-[80px] ${
          editorTheme === "dark"
            ? "bg-white/5 hover:bg-white/10 text-slate-300"
            : "bg-gray-100 hover:bg-gray-200 text-gray-900"
        }`}
      >
        <span className="flex-1 text-left truncate">{currentValue}</span>
        <span className="text-xs">▼</span>
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setShowFontMenu(false);
              setShowFontSizeMenu(false);
              setShowAlignMenu(false);
              setShowSpacingMenu(false);
              setShowColorPicker(false);
              setShowHighlightPicker(false);
              setShowImageAlignMenu(false);
            }}
          />
          <div className={`absolute top-full left-0 mt-1 rounded-lg shadow-xl z-20 min-w-[160px] max-h-[300px] overflow-y-auto ${
            editorTheme === "dark"
              ? "bg-[#0a0f1a] border border-white/10"
              : "bg-white border border-gray-300"
          }`}>
            {children}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-wrap items-center gap-2 p-2">
      {/* Font Family */}
      <Dropdown
        topLabel="Font"
        currentValue={getCurrentFont()}
        isOpen={showFontMenu}
        onToggle={() => setShowFontMenu(!showFontMenu)}
      >
        {fonts.map((font) => (
          <button
            key={font.value}
            type="button"
            onClick={() => {
              if (font.value) {
                editor.chain().focus().setFontFamily(font.value).run();
              } else {
                editor.chain().focus().unsetFontFamily().run();
              }
              setShowFontMenu(false);
            }}
            className={`w-full text-left px-3 py-2 text-sm ${
              editorTheme === "dark"
                ? "hover:bg-white/10 text-slate-300"
                : "hover:bg-gray-100 text-gray-900"
            }`}
            style={{ fontFamily: font.value || undefined }}
          >
            {font.name}
          </button>
        ))}
      </Dropdown>

      {/* Font Size */}
      <Dropdown
        topLabel="Size"
        currentValue={getCurrentFontSize()}
        isOpen={showFontSizeMenu}
        onToggle={() => setShowFontSizeMenu(!showFontSizeMenu)}
      >
        {fontSizes.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => {
              editor.chain().focus().setFontSize(size).run();
              setShowFontSizeMenu(false);
            }}
            className={`w-full text-left px-3 py-2 text-sm ${
              editorTheme === "dark"
                ? "hover:bg-white/10 text-slate-300"
                : "hover:bg-gray-100 text-gray-900"
            }`}
          >
            {size}
          </button>
        ))}
      </Dropdown>

      <span className="h-6 w-px bg-white/10" />

      {/* Bold, Italic, Underline, Strike */}
      <Btn
        label="B"
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <Btn
        label="I"
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <Btn
        label="U"
        title="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <Btn
        label="S"
        title="Strike"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />

      <span className="h-6 w-px bg-white/10" />

      {/* Text Color */}
      <Dropdown
        topLabel="Color"
        currentValue={getCurrentColor()}
        isOpen={showColorPicker}
        onToggle={() => setShowColorPicker(!showColorPicker)}
      >
        <div className="grid grid-cols-5 gap-1 p-2">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                editor.chain().focus().setColor(color).run();
                setShowColorPicker(false);
              }}
              className="w-8 h-8 rounded border border-white/20 hover:border-white/40 transition-colors"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().unsetColor().run();
            setShowColorPicker(false);
          }}
          className="w-full text-left px-3 py-2 hover:bg-white/10 text-sm text-slate-300 border-t border-white/10"
        >
          Reset Color
        </button>
      </Dropdown>

      {/* Highlight */}
      <Dropdown
        topLabel="Highlight"
        currentValue={getCurrentHighlight()}
        isOpen={showHighlightPicker}
        onToggle={() => setShowHighlightPicker(!showHighlightPicker)}
      >
        <div className="grid grid-cols-5 gap-1 p-2">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                editor.chain().focus().toggleHighlight({ color }).run();
                setShowHighlightPicker(false);
              }}
              className="w-8 h-8 rounded border border-white/20 hover:border-white/40 transition-colors"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().unsetHighlight().run();
            setShowHighlightPicker(false);
          }}
          className="w-full text-left px-3 py-2 hover:bg-white/10 text-sm text-slate-300 border-t border-white/10"
        >
          Remove Highlight
        </button>
      </Dropdown>

      <span className="h-6 w-px bg-white/10" />

      {/* Alignment */}
      <Dropdown
        topLabel="Align"
        currentValue={getCurrentAlign()}
        isOpen={showAlignMenu}
        onToggle={() => setShowAlignMenu(!showAlignMenu)}
      >
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().setTextAlign('left').run();
            setShowAlignMenu(false);
          }}
          className="w-full text-left px-3 py-2 hover:bg-white/10 text-sm text-slate-300 flex items-center gap-2"
        >
          <span>⬅</span> Left
        </button>
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().setTextAlign('center').run();
            setShowAlignMenu(false);
          }}
          className="w-full text-left px-3 py-2 hover:bg-white/10 text-sm text-slate-300 flex items-center gap-2"
        >
          <span>↔</span> Center
        </button>
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().setTextAlign('right').run();
            setShowAlignMenu(false);
          }}
          className="w-full text-left px-3 py-2 hover:bg-white/10 text-sm text-slate-300 flex items-center gap-2"
        >
          <span>➡</span> Right
        </button>
      </Dropdown>

      {/* Line Spacing */}
      <Dropdown
        topLabel="Spacing"
        currentValue={getCurrentLineHeight()}
        isOpen={showSpacingMenu}
        onToggle={() => setShowSpacingMenu(!showSpacingMenu)}
      >
        {lineHeights.map((lh) => (
          <button
            key={lh.value}
            type="button"
            onClick={() => {
              editor.chain().focus().setLineHeight(lh.value).run();
              setShowSpacingMenu(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-white/10 text-sm text-slate-300"
          >
            {lh.name}
          </button>
        ))}
      </Dropdown>

      <span className="h-6 w-px bg-white/10" />

      {/* Lists */}
      <Btn
        label="• List"
        title="Bullet List"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <Btn
        label="1. List"
        title="Numbered List"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />

      <span className="h-6 w-px bg-white/10" />

      {/* Horizontal Rule */}
      <Btn
        label="—"
        title="Horizontal Line"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />

      {/* Image Alignment - only show when image is selected */}
      {isImageSelected() && (
        <>
          <span className="h-6 w-px bg-white/10" />
          <Dropdown
            topLabel="Image"
            currentValue={getCurrentImageAlign()}
            isOpen={showImageAlignMenu}
            onToggle={() => setShowImageAlignMenu(!showImageAlignMenu)}
          >
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().setImageAlign("left").run();
                setShowImageAlignMenu(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-white/10 text-sm text-slate-300"
            >
              Left
            </button>
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().setImageAlign("center").run();
                setShowImageAlignMenu(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-white/10 text-sm text-slate-300"
            >
              Center
            </button>
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().setImageAlign("right").run();
                setShowImageAlignMenu(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-white/10 text-sm text-slate-300"
            >
              Right
            </button>
            <div className="h-px bg-white/10 my-1" />
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().setImageFloat("left").run();
                setShowImageAlignMenu(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-white/10 text-sm text-slate-300"
            >
              Wrap Right (Float Left)
            </button>
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().setImageFloat("right").run();
                setShowImageAlignMenu(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-white/10 text-sm text-slate-300"
            >
              Wrap Left (Float Right)
            </button>
          </Dropdown>
        </>
      )}

      <span className="h-6 w-px bg-white/10" />

      {/* Image */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: "none" }}
      />
      <Btn
        label="🖼 Image"
        title="Insert Image"
        onClick={() => fileInputRef.current?.click()}
      />

      {/* Table */}
      <Btn
        label="⊞ Table"
        title="Insert Table"
        onClick={() => setShowTableModal(true)}
      />

      {/* Table Modal */}
      {showTableModal && (
        <TableInsertModal
          editor={editor}
          onClose={() => setShowTableModal(false)}
        />
      )}
    </div>
  );
}
