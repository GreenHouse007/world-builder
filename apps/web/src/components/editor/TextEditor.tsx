import { useEffect, useState } from "react";
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
// import { EditorBubble } from "./EditorBubbleMenu"; // TODO: Fix for Tiptap v3
import SlashCommand from "../../extensions/SlashCommand";
import { BlockDragHandle } from "../../extensions/BlockDragHandle";
import { DraggableBlocks } from "../../extensions/DraggableBlocks";
import { WordCountPanel } from "./WordCountPanel";
import { FontSize } from "../../extensions/FontSize";
import { LineHeight } from "../../extensions/LineHeight";
import { CustomTableCell } from "../../extensions/CustomTableCell";
import { CustomTableHeader } from "../../extensions/CustomTableHeader";

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
          return false;
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
    </div>
  );
}
