import { type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";

export function EditorBubble({ editor }: { editor: Editor }) {
  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 120 }}
      className="rounded-lg border border-white/10 bg-[#0b101a]/95 backdrop-blur px-1 py-1 shadow-xl"
    >
      <button
        className={btn(editor.isActive("bold"))}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </button>
      <button
        className={btn(editor.isActive("italic"))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        I
      </button>
      <button
        className={btn(editor.isActive("underline"))}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        U
      </button>
      <button
        className={btn(editor.isActive("strike"))}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        S
      </button>
      <span className="mx-1 h-5 w-px bg-white/10 inline-block" />
      <button
        className={btn(editor.isActive("code"))}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        {"</>"}
      </button>
      <button
        className={btn(editor.isActive("link"))}
        onClick={() => {
          const url = window.prompt("Paste a link");
          if (!url) return;
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url })
            .run();
        }}
      >
        🔗
      </button>
      <button
        className={btn(editor.isActive("highlight"))}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        ✨
      </button>
    </BubbleMenu>
  );
}

function btn(active: boolean) {
  return (
    "px-2 py-1 text-sm rounded-md " +
    (active ? "bg-white/15 text-slate-50" : "hover:bg-white/10")
  );
}
