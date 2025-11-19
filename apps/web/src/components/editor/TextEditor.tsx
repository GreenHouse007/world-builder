import { useEffect, useState, useRef } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Gapcursor from "@tiptap/extension-gapcursor";
import { Table } from "@tiptap/extension-table/table";
import TableRow from "@tiptap/extension-table-row";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { FontFamily } from "@tiptap/extension-font-family";
import { TextAlign } from "@tiptap/extension-text-align";

import { EditorToolbar } from "./EditorToolbar";
import { TableContextMenu } from "./TableContextMenu";
import { EditorContextMenu } from "./EditorContextMenu";
import { ImageContextMenu } from "./ImageContextMenu";
// import { EditorBubble } from "./EditorBubbleMenu"; // TODO: Fix for Tiptap v3
import SlashCommand from "../../extensions/SlashCommand";
import { BlockDragHandle } from "../../extensions/BlockDragHandle";
import { DraggableBlocks } from "../../extensions/DraggableBlocks";
import { WordCountPanel } from "./WordCountPanel";
import { FontSize } from "../../extensions/FontSize";
import { LineHeight } from "../../extensions/LineHeight";
import { CustomTableCell } from "../../extensions/CustomTableCell";
import { CustomTableHeader } from "../../extensions/CustomTableHeader";
import { ResizableImage } from "../../extensions/ResizableImage";
import { uploadImage } from "../../lib/imageUpload";

type Props = {
  initialContent: string | null;
  onChange: (html: string) => void;
  onSaveStart?: () => void;
  onSaveEnd?: () => void;
  placeholder?: string;
};

export function TextEditor({
  initialContent,
  onChange,
  onSaveStart,
  onSaveEnd,
  placeholder = "Start writing your world…",
}: Props) {
  const [html, setHtml] = useState(initialContent || "");
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [tableMenuPos, setTableMenuPos] = useState({ x: 0, y: 0 });
  const [showEditorMenu, setShowEditorMenu] = useState(false);
  const [editorMenuPos, setEditorMenuPos] = useState({ x: 0, y: 0 });
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [imageMenuPos, setImageMenuPos] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: {},
        blockquote: {},
        heading: { levels: [1, 2, 3] },
        listItem: {},
        bulletList: {},
        orderedList: {},
        horizontalRule: {},
      }),
      Underline,
      Link.configure({ autolink: true, openOnClick: true, linkOnPaste: true }),
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder }),
      Gapcursor,

      // New formatting extensions
      TextStyle,
      Color,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
      FontSize.configure({
        types: ['textStyle'],
      }),
      LineHeight.configure({
        types: ['paragraph', 'heading'],
      }),

      // images
      ResizableImage.configure({
        inline: true,
        allowBase64: false,
      }),

      // tables
      Table.configure({ resizable: true, lastColumnResizable: true }),
      TableRow,
      CustomTableHeader,
      CustomTableCell,

      // phase 3
      SlashCommand,
      DraggableBlocks,
      BlockDragHandle,
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-[48vh] leading-relaxed relative [&_table]:border-collapse [&_table]:border-slate-600 [&_th]:border [&_th]:border-slate-600 [&_th]:px-4 [&_th]:py-2 [&_td]:border [&_td]:border-slate-600 [&_td]:px-4 [&_td]:py-2",
      },
      handleDOMEvents: {
        mousedown: () => false,
        contextmenu: (view, event) => {
          const target = event.target as HTMLElement;

          // Check if right-click was on a table cell or header
          if (target.tagName === "TD" || target.tagName === "TH" || target.closest("td, th")) {
            event.preventDefault();
            setTableMenuPos({ x: event.clientX, y: event.clientY });
            setShowTableMenu(true);
            return true;
          }

          // Check if right-click was on an image
          if (target.tagName === "IMG") {
            event.preventDefault();
            setImageMenuPos({ x: event.clientX, y: event.clientY });
            setShowImageMenu(true);
            return true;
          }

          // Show editor context menu for other areas
          event.preventDefault();
          setEditorMenuPos({ x: event.clientX, y: event.clientY });
          setShowEditorMenu(true);
          return true;
        },
        drop: (view, event) => {
          const hasFiles = event.dataTransfer?.files?.length;
          if (!hasFiles) return false;

          const images = Array.from(event.dataTransfer.files).filter((file) =>
            file.type.startsWith("image/")
          );

          if (images.length === 0) return false;

          event.preventDefault();

          const { schema } = view.state;
          const coordinates = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });

          images.forEach(async (image) => {
            try {
              const url = await uploadImage(image);
              const node = schema.nodes.resizableImage.create({
                src: url,
                alt: image.name,
                height: "300px",
              });

              const transaction = view.state.tr.insert(coordinates?.pos || 0, node);
              view.dispatch(transaction);
            } catch (error) {
              console.error("Failed to upload image:", error);
            }
          });

          return true;
        },
        paste: (view, event) => {
          const hasFiles = event.clipboardData?.files?.length;
          if (!hasFiles) return false;

          const images = Array.from(event.clipboardData.files).filter((file) =>
            file.type.startsWith("image/")
          );

          if (images.length === 0) return false;

          event.preventDefault();

          const { schema } = view.state;
          const { selection } = view.state;

          images.forEach(async (image) => {
            try {
              const url = await uploadImage(image);
              const node = schema.nodes.resizableImage.create({
                src: url,
                alt: "Pasted image",
                height: "300px",
              });

              const transaction = view.state.tr.replaceSelectionWith(node);
              view.dispatch(transaction);
            } catch (error) {
              console.error("Failed to upload image:", error);
            }
          });

          return true;
        },
      },
    },
    onUpdate: ({ editor }) => {
      const next = editor.getHTML();
      setHtml(next);
      onChange(next);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const start = () => onSaveStart?.();
    const end = () => onSaveEnd?.();
    editor.on("transaction", start);
    editor.on("selectionUpdate", end);
    return () => {
      editor.off("transaction", start);
      editor.off("selectionUpdate", end);
    };
  }, [editor, onSaveStart, onSaveEnd]);

  // keep local html when initialContent changes (e.g., page switch)
  useEffect(() => {
    setHtml(initialContent || "");
  }, [initialContent]);

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#070b12]">
      <div className="border-b border-white/10 p-2">
        <EditorToolbar editor={editor as Editor} />
      </div>

      <div className="relative px-4 py-3">
        {/* TODO: Fix BubbleMenu for Tiptap v3 */}
        {/* {editor && <EditorBubble editor={editor as Editor} />} */}
        <EditorContent editor={editor as Editor} />
      </div>

      <div className="px-4 pb-3">
        <WordCountPanel html={html} />
      </div>

      {/* Table Context Menu */}
      {showTableMenu && editor && (
        <TableContextMenu
          editor={editor as Editor}
          x={tableMenuPos.x}
          y={tableMenuPos.y}
          onClose={() => setShowTableMenu(false)}
        />
      )}

      {/* Editor Context Menu */}
      {showEditorMenu && editor && (
        <EditorContextMenu
          editor={editor as Editor}
          x={editorMenuPos.x}
          y={editorMenuPos.y}
          onClose={() => setShowEditorMenu(false)}
        />
      )}

      {/* Image Context Menu */}
      {showImageMenu && editor && (
        <ImageContextMenu
          editor={editor as Editor}
          x={imageMenuPos.x}
          y={imageMenuPos.y}
          onClose={() => setShowImageMenu(false)}
        />
      )}

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
      />
    </div>
  );
}
