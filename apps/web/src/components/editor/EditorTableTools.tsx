import type { Editor } from "@tiptap/react";
// 👇 this brings in the command type augmentation for addColumnBefore, etc.
import "@tiptap/extension-table";
import type { ReactNode } from "react";

export function EditorTableTools({ editor }: { editor: Editor }) {
  const inTable = editor?.isActive("table");

  // Helper to create a focused chain for table commands
  const chain = () => editor.chain().focus();

  const Btn = ({
    onClick,
    children,
    disabled,
    title,
  }: {
    onClick: () => void;
    children: ReactNode;
    disabled?: boolean;
    title?: string;
  }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="px-2 py-1 text-xs rounded-lg mr-1 bg-white/5 hover:bg-white/10 disabled:opacity-50"
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Btn
        title="Insert table 3×3"
        onClick={() =>
          chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        ▦ New 3×3
      </Btn>

      <span className="mx-2 h-5 w-px bg-white/10" />

      <Btn
        disabled={!inTable}
        title="Add column before"
        onClick={() => chain().addColumnBefore().run()}
      >
        + Col ◀
      </Btn>
      <Btn
        disabled={!inTable}
        title="Add column after"
        onClick={() => chain().addColumnAfter().run()}
      >
        + Col ▶
      </Btn>
      <Btn
        disabled={!inTable}
        title="Delete column"
        onClick={() => chain().deleteColumn().run()}
      >
        – Col
      </Btn>

      <span className="mx-2 h-5 w-px bg-white/10" />

      <Btn
        disabled={!inTable}
        title="Add row above"
        onClick={() => chain().addRowBefore().run()}
      >
        + Row ▲
      </Btn>
      <Btn
        disabled={!inTable}
        title="Add row below"
        onClick={() => chain().addRowAfter().run()}
      >
        + Row ▼
      </Btn>
      <Btn
        disabled={!inTable}
        title="Delete row"
        onClick={() => chain().deleteRow().run()}
      >
        – Row
      </Btn>

      <span className="mx-2 h-5 w-px bg-white/10" />

      <Btn
        disabled={!inTable}
        title="Toggle header row"
        onClick={() => chain().toggleHeaderRow().run()}
      >
        H Row
      </Btn>
      <Btn
        disabled={!inTable}
        title="Merge cells"
        onClick={() => chain().mergeCells().run()}
      >
        Merge
      </Btn>
      <Btn
        disabled={!inTable}
        title="Split cell"
        onClick={() => chain().splitCell().run()}
      >
        Split
      </Btn>
      <Btn
        disabled={!inTable}
        title="Delete table"
        onClick={() => chain().deleteTable().run()}
      >
        Delete Table
      </Btn>
    </div>
  );
}
