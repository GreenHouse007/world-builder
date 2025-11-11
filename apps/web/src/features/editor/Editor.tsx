import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function Editor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Start writing…</p>",
  });
  return (
    <div className="prose max-w-none">
      <EditorContent editor={editor} />
    </div>
  );
}
