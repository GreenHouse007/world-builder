import { Extension } from "@tiptap/core";

export const DraggableBlocks = Extension.create({
  name: "draggableBlocks",
  addGlobalAttributes() {
    return [
      {
        types: [
          "heading",
          "blockquote",
          "orderedList",
          "bulletList",
          "codeBlock",
          "table",
        ],
        attributes: {
          draggable: {
            default: true,
            renderHTML: (attrs) => ({
              draggable: attrs.draggable ? "true" : undefined,
            }),
          },
        },
      },
    ];
  },
});
