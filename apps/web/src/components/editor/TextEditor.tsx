import { useEffect, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table/table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";

import { EditorToolbar } from "./EditorToolbar";
// import { EditorBubble } from "./EditorBubbleMenu"; // TODO: Fix for Tiptap v3
import { EditorTableTools } from "./EditorTableTools";
import SlashCommand from "../../extensions/SlashCommand";
import { BlockDragHandle } from "../../extensions/BlockDragHandle";
import { DraggableBlocks } from "../../extensions/DraggableBlocks";
import { WordCountPanel } from "./WordCountPanel";

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
      Highlight,
      Placeholder.configure({ placeholder }),

      // tables
      Table.configure({ resizable: true, lastColumnResizable: true }),
      TableRow,
      TableHeader,
      TableCell,

      // phase 3
      SlashCommand,
      DraggableBlocks,
      BlockDragHandle,
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-[48vh] leading-relaxed relative",
      },
      handleDOMEvents: { mousedown: () => false },
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

      <div className="border-b border-white/10 px-2 py-1">
        {editor && <EditorTableTools editor={editor as Editor} />}
      </div>

      <div className="relative px-4 py-3">
        {/* TODO: Fix BubbleMenu for Tiptap v3 */}
        {/* {editor && <EditorBubble editor={editor as Editor} />} */}
        <EditorContent editor={editor as Editor} />
      </div>

      <div className="px-4 pb-3">
        <WordCountPanel html={html} />
      </div>
    </div>
  );
}
