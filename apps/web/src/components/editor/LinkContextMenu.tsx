import { useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import { useTheme } from "../../store/theme";

interface LinkContextMenuProps {
  editor: Editor;
  x: number;
  y: number;
  existingLink?: {
    href: string;
    type: "internal" | "external";
    pageId?: string;
    pageTitle?: string;
  };
  onClose: () => void;
  onLinkToPage: () => void;
  onLinkToUrl: () => void;
  onEditLink: () => void;
  onRemoveLink: () => void;
}

export function LinkContextMenu({
  editor,
  x,
  y,
  existingLink,
  onClose,
  onLinkToPage,
  onLinkToUrl,
  onEditLink,
  onRemoveLink,
}: LinkContextMenuProps) {
  const { editorTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Adjust position to keep menu in viewport
  const adjustedPosition = {
    x: Math.min(x, window.innerWidth - 220),
    y: Math.min(y, window.innerHeight - 200),
  };

  const MenuItem = ({
    label,
    onClick,
    icon,
    danger,
  }: {
    label: string;
    onClick: () => void;
    icon?: string;
    danger?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
        danger
          ? editorTheme === "dark"
            ? "text-red-400 hover:bg-red-500/10"
            : "text-red-600 hover:bg-red-50"
          : editorTheme === "dark"
          ? "hover:bg-white/10 text-slate-300"
          : "hover:bg-gray-100 text-gray-900"
      }`}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />

      {/* Menu */}
      <div
        ref={menuRef}
        className={`fixed z-[9999] min-w-[200px] rounded-lg shadow-xl ${
          editorTheme === "dark"
            ? "bg-[#0a0f1a] border border-white/10"
            : "bg-white border border-gray-300"
        }`}
        style={{
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
        }}
      >
        {existingLink ? (
          // Edit existing link menu
          <div className="py-1">
            <MenuItem label="Edit Link" onClick={onEditLink} icon="✏️" />
            <MenuItem
              label="Remove Link"
              onClick={onRemoveLink}
              icon="🗑️"
              danger
            />
            {existingLink.type === "internal" && existingLink.pageTitle && (
              <>
                <div
                  className={`h-px my-1 ${
                    editorTheme === "dark" ? "bg-white/10" : "bg-gray-200"
                  }`}
                />
                <div className="px-3 py-2 text-xs text-slate-400">
                  Linked to: {existingLink.pageTitle}
                </div>
              </>
            )}
          </div>
        ) : (
          // Create new link menu
          <div className="py-1">
            <MenuItem
              label="Link to page..."
              onClick={onLinkToPage}
              icon="📄"
            />
            <MenuItem label="Link to URL..." onClick={onLinkToUrl} icon="🔗" />
          </div>
        )}
      </div>
    </>
  );
}
