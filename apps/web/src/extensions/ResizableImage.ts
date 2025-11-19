import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ResizableImageView } from "./ResizableImageView";

export const ResizableImage = Image.extend({
  name: "resizableImage",

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => element.style.width || element.getAttribute("width"),
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {};
          }
          return {
            width: attributes.width,
            style: `width: ${attributes.width};`
          };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => element.style.height || element.getAttribute("height"),
        renderHTML: (attributes) => {
          if (!attributes.height) {
            return {};
          }
          return {
            height: attributes.height,
            style: `height: ${attributes.height};`
          };
        },
      },
      float: {
        default: null,
        parseHTML: (element) => {
          const float = element.style.float;
          return float || null;
        },
        renderHTML: (attributes) => {
          if (!attributes.float) {
            return {};
          }
          return {
            style: `float: ${attributes.float}; margin: ${
              attributes.float === "left" ? "0 1rem 1rem 0" : "0 0 1rem 1rem"
            };`,
          };
        },
      },
      align: {
        default: null,
        parseHTML: (element) => element.style.textAlign || element.getAttribute("data-align"),
        renderHTML: (attributes) => {
          if (!attributes.align) {
            return {};
          }
          // If float is set, don't apply text-align
          if (attributes.float) {
            return { "data-align": attributes.align };
          }
          return {
            style: `display: block; margin-left: ${
              attributes.align === "center"
                ? "auto"
                : attributes.align === "right"
                ? "auto"
                : "0"
            }; margin-right: ${
              attributes.align === "center"
                ? "auto"
                : attributes.align === "right"
                ? "0"
                : "auto"
            };`,
            "data-align": attributes.align,
          };
        },
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImageWidth:
        (width: number) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { width: `${width}px` });
        },
      setImageHeight:
        (height: number) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { height: `${height}px` });
        },
      setImageFloat:
        (float: "left" | "right" | null) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { float });
        },
      setImageAlign:
        (align: "left" | "center" | "right" | null) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { align, float: null });
        },
    };
  },
});
