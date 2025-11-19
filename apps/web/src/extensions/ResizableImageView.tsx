import { NodeViewWrapper } from "@tiptap/react";
import { useState, useRef, useEffect } from "react";

export function ResizableImageView(props: any) {
  const { node, updateAttributes, selected } = props;
  const [isResizing, setIsResizing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: node.attrs.width ? parseInt(node.attrs.width) : null,
    height: node.attrs.height ? parseInt(node.attrs.height) : null,
  });
  const imageRef = useRef<HTMLImageElement>(null);
  const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const handleImageLoad = () => {
    if (!isLoaded && imageRef.current && !node.attrs.width && !node.attrs.height) {
      setIsLoaded(true);
      // Set initial dimensions based on natural size, max 300px height
      const img = imageRef.current;
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      const maxHeight = 300;
      const height = Math.min(img.naturalHeight, maxHeight);
      const width = height * aspectRatio;

      setDimensions({ width, height });
      updateAttributes({ width: `${width}px`, height: `${height}px` });
    }
  };

  useEffect(() => {
    if (node.attrs.width) {
      setDimensions({
        width: parseInt(node.attrs.width),
        height: node.attrs.height ? parseInt(node.attrs.height) : null,
      });
    }
  }, [node.attrs.width, node.attrs.height]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const img = imageRef.current;
    if (!img) return;

    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      width: img.offsetWidth,
      height: img.offsetHeight,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;

      // Use the larger delta to maintain aspect ratio
      const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;

      const newWidth = Math.max(100, startPos.current.width + delta);
      const aspectRatio = startPos.current.width / startPos.current.height;
      const newHeight = newWidth / aspectRatio;

      setDimensions({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      updateAttributes({
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
      });
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const getFloat = () => {
    if (node.attrs.float === "left") return "left";
    if (node.attrs.float === "right") return "right";
    return "none";
  };

  const getAlign = () => {
    if (node.attrs.float) return "";
    if (node.attrs.align === "center") return "0 auto";
    if (node.attrs.align === "right") return "0 0 0 auto";
    return "0";
  };

  return (
    <NodeViewWrapper
      className="resizable-image-wrapper"
      style={{
        display: "inline-block",
        position: "relative",
        float: getFloat() as any,
        margin: node.attrs.float === "left" ? "0 1rem 1rem 0" : node.attrs.float === "right" ? "0 0 1rem 1rem" : getAlign(),
        border: selected ? "2px solid rgba(59, 130, 246, 0.8)" : "2px solid transparent",
        borderRadius: "4px",
        padding: "2px",
      }}
    >
      <img
        ref={imageRef}
        src={node.attrs.src}
        alt={node.attrs.alt}
        onLoad={handleImageLoad}
        style={{
          width: dimensions.width ? `${dimensions.width}px` : undefined,
          height: dimensions.height ? `${dimensions.height}px` : undefined,
          display: "block",
          maxWidth: "100%",
        }}
      />
      {selected && (
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: "16px",
            height: "16px",
            backgroundColor: "rgba(59, 130, 246, 1)",
            border: "2px solid white",
            borderRadius: "0 0 4px 0",
            cursor: "nwse-resize",
            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
          }}
          className="resize-handle"
        />
      )}
    </NodeViewWrapper>
  );
}
