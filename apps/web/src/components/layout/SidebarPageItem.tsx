// layout/SidebarPageItem.tsx
import { useState, useEffect, useRef } from "react";
import { PageContextMenu } from "./PageContextMenu";
import { usePages } from "../../store/pages";
import { useWorlds } from "../../store/worlds";

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
  const { createPage, renamePage, duplicatePage, deletePage, setCurrentPage, toggleFavorite, toggleCollapse } = usePages();
  const editingPageId = usePages((s) => s.editingPageId);
  const { currentWorldId } = useWorlds();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.title);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Enter edit mode when this page is marked for editing
  useEffect(() => {
    if (editingPageId === node._id) {
      setEditing(true);
      setDraft(node.title);
      usePages.getState().setEditingPage(null); // Clear the flag
    }
  }, [editingPageId, node._id, node.title]);

  // Auto-select text when input becomes visible
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.select();
    }
  }, [editing]);

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
          onClick={() => hasChildren && toggleCollapse(node._id)}
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
          onClick={() => toggleFavorite(node._id)}
          title={node.isFavorite ? "Unfavorite" : "Favorite"}
        >
          {node.isFavorite ? "★" : "☆"}
        </button>

        {/* Title / Inline rename */}
        {editing ? (
          <input
            ref={inputRef}
            autoFocus
            className="flex-1 bg-transparent outline-none text-slate-100 text-sm text-left border-0 p-0 m-0"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={async () => {
              setEditing(false);
              const t = draft.trim();
              if (t && t !== node.title) await renamePage(node._id, t);
              else setDraft(node.title);
            }}
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setEditing(false);
                const t = draft.trim();
                if (t && t !== node.title)
                  await renamePage(node._id, t);
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
            className="flex-1 text-left text-sm text-slate-200 truncate p-0 m-0"
            onClick={() => setCurrentPage(node._id)}
            onDoubleClick={() => setEditing(true)}
            title={node.title}
          >
            {node.title}
          </button>
        )}

        {/* + button to add child page */}
        <button
          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={async () => {
            if (!currentWorldId) return;
            await createPage(currentWorldId, node._id);
          }}
          title="Add child page"
        >
          +
        </button>

        {/* … menu */}
        <button
          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            const rect = (
              e.currentTarget as HTMLElement
            ).getBoundingClientRect();
            // Move up by approximately one label row height (~32px)
            setMenu({ x: rect.left, y: rect.top - 32 });
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
          onDuplicate={() => duplicatePage(node._id)}
          onDelete={() => deletePage(node._id)}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}
