import { Extension, type Editor as TiptapEditor } from "@tiptap/core";
import Suggestion, { type SuggestionProps } from "@tiptap/suggestion";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import { useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  EditorSlashMenu,
  type SlashItem,
} from "../components/editor/EditorSlashMenu";

type SlashOptions = {
  char: string;
};

const SlashCommand = Extension.create<SlashOptions>({
  name: "slashCommand",
  addOptions() {
    return {
      char: "/",
    };
  },
  addProseMirrorPlugins() {
    const editor = this.editor;
    let component: Root | null = null;
    let popup: TippyInstance[] = [];
    let dom: HTMLDivElement | null = null;

    const render = (props: SuggestionProps) => {
      const { clientRect } = props;

      if (!dom) {
        dom = document.createElement("div");
      }

      const items: SlashItem[] = buildItems(editor, props);

      if (!component) {
        component = createRoot(dom);
      }
      component.render(<SlashPortal props={props} items={items} />);

      // Ensure clientRect never returns null for tippy
      const safeClientRect = () => {
        const rect = clientRect?.();
        return rect ?? new DOMRect(0, 0, 0, 0);
      };

      if (!popup.length) {
        popup = tippy("body", {
          getReferenceClientRect: safeClientRect,
          appendTo: () => document.body,
          content: dom,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
          theme: "light",
        });
      } else {
        popup[0].setProps({
          getReferenceClientRect: safeClientRect,
        });
      }
    };

    const destroy = () => {
      popup.forEach((p) => p.destroy());
      popup = [];
      if (component) {
        component.unmount();
        component = null;
      }
    };

    return [
      Suggestion({
        editor,
        char: this.options.char,
        startOfLine: true,
        command: ({ editor, range, props }) => {
          // when user selects an item
          props?.run();
          // remove the slash trigger
          editor
            .chain()
            .focus()
            .insertContentAt({ from: range.from, to: range.to }, "")
            .run();
        },
        allow({ state, range }) {
          // prevent inside code blocks, etc. if desired
          const $from = state.doc.resolve(range.from);
          const parent = $from.parent;
          if (parent.type.name === "codeBlock") return false;
          return true;
        },
        items: ({ query }) => {
          return getCatalog()
            .filter((i) =>
              i.title.toLowerCase().includes(query.toLowerCase().trim())
            )
            .slice(0, 8);
        },
        render: () => {
          return {
            onStart: (props) => render(props),
            onUpdate: (props) => render(props),
            onKeyDown: (props) => {
              if (props.event.key === "Escape") {
                destroy();
                return true;
              }
              return false;
            },
            onExit: () => destroy(),
          };
        },
      }),
    ];
  },
});

export default SlashCommand;

// UI bridge so we can wire items.run to editor commands safely
function SlashPortal({ props, items }: { props: SuggestionProps; items: SlashItem[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => setIndex(0), [items]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIndex((i) => (i + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setIndex((i) => (i - 1 + items.length) % items.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        items[index]?.run();
        props?.editor?.commands.deleteRange(props.range);
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKey, { capture: true });
  }, [items, index, props]);

  return <EditorSlashMenu items={items} selectedIndex={index} />;
}

function getCatalog() {
  // basic catalog; actual commands supplied at runtime in buildItems()
  return [
    { key: "h1", title: "Heading 1" },
    { key: "h2", title: "Heading 2" },
    { key: "h3", title: "Heading 3" },
    { key: "p", title: "Paragraph" },
    { key: "ul", title: "Bulleted list" },
    { key: "ol", title: "Numbered list" },
    { key: "quote", title: "Quote" },
    { key: "hr", title: "Divider" },
    { key: "table", title: "Table (3×3)" },
  ];
}

function buildItems(editor: TiptapEditor, props: SuggestionProps) {
  const runAt = () =>
    editor.chain().focus().insertContentAt(props.range, "").run();

  return getCatalog().map((i) => {
    let run = () => {};
    switch (i.key) {
      case "h1":
        run = () => {
          runAt();
          editor
            .chain()
            .focus()
            .setNode("paragraph")
            .toggleHeading({ level: 1 })
            .run();
        };
        break;
      case "h2":
        run = () => {
          runAt();
          editor
            .chain()
            .focus()
            .setNode("paragraph")
            .toggleHeading({ level: 2 })
            .run();
        };
        break;
      case "h3":
        run = () => {
          runAt();
          editor
            .chain()
            .focus()
            .setNode("paragraph")
            .toggleHeading({ level: 3 })
            .run();
        };
        break;
      case "p":
        run = () => {
          runAt();
          editor.chain().focus().setParagraph().run();
        };
        break;
      case "ul":
        run = () => {
          runAt();
          editor.chain().focus().toggleBulletList().run();
        };
        break;
      case "ol":
        run = () => {
          runAt();
          editor.chain().focus().toggleOrderedList().run();
        };
        break;
      case "quote":
        run = () => {
          runAt();
          editor.chain().focus().toggleBlockquote().run();
        };
        break;
      case "hr":
        run = () => {
          // remove trigger then add hr
          editor
            .chain()
            .focus()
            .deleteRange(props.range)
            .setHorizontalRule()
            .run();
        };
        break;
      case "table":
        run = () => {
          runAt();
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run();
        };
        break;
    }
    return { title: i.title, run };
  });
}
