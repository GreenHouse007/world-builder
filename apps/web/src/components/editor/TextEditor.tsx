import { useEffect } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";

import { EditorToolbar } from "./EditorToolbar";
import { EditorBubble } from "./EditorBubbleMenu";

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
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // leave codeBlock/blockquote/lists/hr/history as defaults
      }),
      Underline,
      Link.configure({ autolink: true, openOnClick: true, linkOnPaste: true }),
      Highlight,
      Placeholder.configure({ placeholder }),
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-[48vh] leading-relaxed",
      },
      // if clicks don’t focus, remove this:
      // handleDOMEvents: { mousedown: () => false },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
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

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#070b12]">
      <div className="border-b border-white/10 p-2">
        <EditorToolbar editor={editor as Editor} />
      </div>
      <div className="px-4 py-3">
        {editor && <EditorBubble editor={editor as Editor} />}
        <EditorContent editor={editor as Editor} />
      </div>
    </div>
  );
}
