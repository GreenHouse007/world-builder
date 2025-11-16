// layout/SidebarPageItem.tsx
import { useState } from "react";
import { PageContextMenu } from "./PageContextMenu";
import { usePages } from "../../store/pages";

type PageNode = {
  _id: string;
  title: string;
  isCollapsed?: boolean;
  isFavorite?: boolean;
  children?: PageNode[];
};

export function SidebarPageItem({
  node,
  depth,
  visible,
}: {
  node: PageNode;
  depth: number;
  visible: boolean;
}) {
  const pages = usePages.getState();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.title);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  if (!visible) return null;

  const hasChildren = !!(node.children && node.children.length);

  return (
    <div className="select-none">
      <div
        className="group flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5"
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        {/* Collapse caret or dot */}
        <button
          className={`w-5 h-5 flex items-center justify-center text-slate-400 ${
            hasChildren ? "hover:text-slate-200" : "cursor-default"
          }`}
          onClick={() => hasChildren && pages.toggleCollapse?.(node._id)}
          title={hasChildren ? (node.isCollapsed ? "Expand" : "Collapse") : ""}
        >
          {hasChildren ? (
            <span
              className={`inline-block transition-transform text-[10px] ${
                node.isCollapsed ? "" : "rotate-90"
              }`}
            >
              ▶
            </span>
          ) : (
            <span className="text-[8px]">•</span>
          )}
        </button>

        {/* Star */}
        <button
          className={`w-5 h-5 flex items-center justify-center ${
            node.isFavorite
              ? "text-amber-400"
              : "text-slate-400 hover:text-amber-400"
          }`}
          onClick={() => pages.toggleFavorite?.(node._id)}
          title={node.isFavorite ? "Unfavorite" : "Favorite"}
        >
          ★
        </button>

        {/* Title / Inline rename */}
        {editing ? (
          <input
            autoFocus
            className="flex-1 bg-transparent outline-none text-slate-100 text-sm"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={async () => {
              setEditing(false);
              const t = draft.trim();
              if (t && t !== node.title) await pages.renamePage?.(node._id, t);
              else setDraft(node.title);
            }}
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setEditing(false);
                const t = draft.trim();
                if (t && t !== node.title)
                  await pages.renamePage?.(node._id, t);
                else setDraft(node.title);
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setEditing(false);
                setDraft(node.title);
              }
            }}
          />
        ) : (
          <button
            className="flex-1 text-left text-sm text-slate-200 truncate"
            onClick={() => pages.setCurrentPage?.(node._id)}
            onDoubleClick={() => setEditing(true)}
            title={node.title}
          >
            {node.title}
          </button>
        )}

        {/* … menu */}
        <button
          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            const rect = (
              e.currentTarget as HTMLElement
            ).getBoundingClientRect();
            setMenu({ x: rect.left, y: rect.bottom + 4 });
          }}
          title="More"
        >
          ⋯
        </button>
      </div>

      {menu && (
        <PageContextMenu
          x={menu.x}
          y={menu.y}
          onRename={() => setEditing(true)}
          onDuplicate={() => usePages.getState().duplicatePage(node._id)}
          onDelete={() => usePages.getState().deletePage(node._id)}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}
