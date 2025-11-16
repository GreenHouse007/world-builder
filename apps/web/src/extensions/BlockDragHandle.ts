import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export const BlockDragHandle = Extension.create({
  name: "blockDragHandle",

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey("blockDragHandle");
    return [
      new Plugin({
        key: pluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            const sel = tr.selection;
            if (!sel || !sel.$from) return DecorationSet.empty;

            // position of the current block
            const $pos = sel.$from;
            const start = $pos.start($pos.depth);
            const deco = Decoration.widget(
              start,
              () => {
                const el = document.createElement("div");
                el.className =
                  "tiptap-block-handle absolute -translate-x-full -ml-6 mt-1 select-none cursor-grab opacity-60 hover:opacity-100";
                el.textContent = "⋮⋮";
                el.title = "Drag block";
                return el;
              },
              { side: -1 }
            );

            return DecorationSet.create(tr.doc, [deco]);
          },
        },
        props: {
          decorations(state) {
            return pluginKey.getState(state) as DecorationSet;
          },
          handleDOMEvents: {
            // allow grabbing without losing selection
            mousedown: (_view, _event) => false,
          },
        },
      }),
    ];
  },
});
