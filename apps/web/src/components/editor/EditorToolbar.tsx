import type { Editor } from "@tiptap/react";

export function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const Btn = ({
    active,
    onClick,
    label,
    title,
  }: {
    active?: boolean;
    onClick: () => void;
    label: string;
    title?: string;
  }) => (
    <button
      type="button"
      title={title || label}
      onClick={onClick}
      className={
        "px-2 py-1 rounded-lg text-sm mr-1 " +
        (active ? "bg-white/15 text-slate-50" : "bg-white/5 hover:bg-white/10")
      }
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-1">
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

      <span className="mx-2 h-5 w-px bg-white/10" />

      <Btn
        label="H1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <Btn
        label="H2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <Btn
        label="H3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />

      <span className="mx-2 h-5 w-px bg-white/10" />

      <Btn
        label="• List"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <Btn
        label="1. List"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <Btn
        label="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <Btn
        label="—"
        title="Horizontal rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />

      <span className="mx-2 h-5 w-px bg-white/10" />

      <Btn
        label="Code"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <Btn
        label="Clear"
        title="Clear marks"
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
      />
    </div>
  );
}
