import { useState, useEffect, type JSX } from "react";
import type { MouseEvent } from "react";
import { useAuth } from "../../store/auth";
import { useWorlds } from "../../store/worlds";
import { usePages, type Page } from "../../store/pages";
import { useFavorites } from "../../store/useFavorites";
import { PageContextMenu } from "./PageContextMenu";

interface PageNode extends Page {
  children: PageNode[];
}

export function Sidebar(): JSX.Element {
  const { user } = useAuth();
  const { currentWorldId } = useWorlds();
  const {
    byWorld,
    currentPageId,
    setCurrentPage,
    createPage,
    renamePage,
    deletePage,
    duplicatePage,
    movePage,
  } = usePages();
  const { fetchFavorites, isFavorite, toggleFavorite } = useFavorites();

  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [openMenu, setOpenMenu] = useState<{
    pageId: string;
    x: number;
    y: number;
  } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // Load favorites whenever world changes
  useEffect(() => {
    if (currentWorldId) {
      void fetchFavorites(currentWorldId);
    }
  }, [currentWorldId, fetchFavorites]);

  const pages = currentWorldId ? byWorld[currentWorldId] || [] : [];
  const tree = buildPageTree(pages);

  const filteredTree =
    search.trim().length > 0 ? filterTreeByQuery(tree, search.trim()) : tree;

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePageClick = (id: string) => {
    setCurrentPage(id);
  };

  const handleDotsClick = (
    e: MouseEvent<HTMLButtonElement>,
    pageId: string
  ) => {
    e.stopPropagation();
    setOpenMenu({
      pageId,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleDragStart = (pageId: string) => {
    setDraggingId(pageId);
  };

  const handleDropOnPage = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    movePage(draggingId, targetId);
    setDraggingId(null);
  };

  const handleDropOnRoot = () => {
    if (!draggingId) return;
    movePage(draggingId, null);
    setDraggingId(null);
  };

  const handleAddPage = async () => {
    if (!currentWorldId) return;
    const page = await createPage(currentWorldId, "New Page", "📄", null);
    if (!page) return;
    setCurrentPage(page._id);
    setEditingPageId(page._id);
    setEditingTitle(page.title);
  };

  const handleToggleFavorite = (pageId: string) => {
    if (!currentWorldId) return;
    void toggleFavorite(currentWorldId, pageId);
  };

  return (
    <>
      <aside
        className="w-72 h-[calc(100vh-5rem)] bg-[#020309]/98 border-r border-white/5 px-5 py-5 flex flex-col gap-6"
        onClick={() => openMenu && setOpenMenu(null)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropOnRoot}
      >
        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-400 flex items-center justify-center text-xs font-semibold text-white">
            {user?.name?.[0] ?? "A"}
          </div>
          <div className="flex flex-col leading-tight text-[11px]">
            <span className="font-medium text-slate-100">
              {user?.name ?? "Storycrafter"}
            </span>
            <span className="text-slate-500">{user?.email ?? "Signed in"}</span>
          </div>
        </div>

        {/* Dashboard */}
        <div>
          <button
            type="button"
            onClick={() => setCurrentPage(null)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition ${
              !currentPageId
                ? "bg-indigo-500/20 text-indigo-200"
                : "bg-transparent hover:bg-white/5 text-slate-300"
            }`}
          >
            <span>📊</span>
            <span>Dashboard</span>
          </button>
        </div>

        {/* Search */}
        <div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages..."
            className="w-full px-3 py-1.5 rounded-xl bg-white/3 border border-white/8 text-[10px] text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-400"
          />
        </div>

        {/* Pages header + + */}
        <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-slate-500">
          <span>Pages</span>
          {currentWorldId && (
            <button
              type="button"
              onClick={handleAddPage}
              className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center hover:bg-indigo-400"
              title="Add page"
            >
              +
            </button>
          )}
        </div>

        {/* Pages tree */}
        <div className="flex-1 overflow-y-auto mt-2 space-y-1">
          {!currentWorldId && (
            <div className="text-[10px] text-slate-500">
              Create or select a world from the top bar to start adding pages.
            </div>
          )}

          {currentWorldId &&
            filteredTree.length === 0 &&
            (search.trim() ? (
              <div className="text-[10px] text-slate-500">
                No pages match “{search}”.
              </div>
            ) : (
              <div className="text-[10px] text-slate-500">
                No pages yet — create one above.
              </div>
            ))}

          {filteredTree.map((node) =>
            renderNode({
              node,
              depth: 0,
              currentWorldId,
              currentPageId,
              collapsed,
              editingPageId,
              editingTitle,
              setEditingPageId,
              setEditingTitle,
              renamePage,
              onToggleCollapse: toggleCollapse,
              onPageClick: handlePageClick,
              onDotsClick: handleDotsClick,
              onDragStart: handleDragStart,
              onDropOnPage: handleDropOnPage,
              isFavorite,
              onToggleFavorite: handleToggleFavorite,
            })
          )}
        </div>

        {/* Info box */}
        <div className="mt-auto bg-white/[0.02] border border-white/10 rounded-2xl p-4 text-[10px] text-slate-400">
          <div className="text-[9px] font-semibold tracking-[0.18em] uppercase text-slate-500 mb-1">
            Insight
          </div>
          Turn your world into a living wiki — nest pages, star favorites, and
          track changes from the dashboard.
        </div>
      </aside>

      {/* Floating context menu */}
      {openMenu && (
        <PageContextMenu
          x={openMenu.x}
          y={openMenu.y}
          onDuplicate={() => duplicatePage(openMenu.pageId)}
          onDelete={() => deletePage(openMenu.pageId)}
          onClose={() => setOpenMenu(null)}
        />
      )}
    </>
  );
}

/* -------- Helpers -------- */

function buildPageTree(pages: Page[]): PageNode[] {
  const byId: Record<string, PageNode> = {};
  const roots: PageNode[] = [];

  pages.forEach((p) => {
    byId[p._id] = { ...p, children: [] };
  });

  pages.forEach((p) => {
    const node = byId[p._id];
    if (p.parentId && byId[p.parentId]) {
      byId[p.parentId].children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodes: PageNode[]) => {
    nodes.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    nodes.forEach((n) => sortNodes(n.children));
  };

  sortNodes(roots);
  return roots;
}

function filterTreeByQuery(nodes: PageNode[], query: string): PageNode[] {
  const q = query.toLowerCase();

  const matchNode = (node: PageNode): PageNode | null => {
    const titleMatches = node.title.toLowerCase().includes(q);
    const filteredChildren = node.children
      .map(matchNode)
      .filter((c): c is PageNode => c !== null);

    if (titleMatches || filteredChildren.length > 0) {
      return { ...node, children: filteredChildren };
    }
    return null;
  };

  return nodes.map(matchNode).filter((n): n is PageNode => n !== null);
}

interface RenderNodeProps {
  node: PageNode;
  depth: number;
  currentWorldId: string | null;
  currentPageId: string | null;
  collapsed: Record<string, boolean>;
  editingPageId: string | null;
  editingTitle: string;
  setEditingPageId: (id: string | null) => void;
  setEditingTitle: (title: string) => void;
  renamePage: (id: string, title: string) => void;
  onToggleCollapse: (id: string) => void;
  onPageClick: (id: string) => void;
  onDotsClick: (e: MouseEvent<HTMLButtonElement>, id: string) => void;
  onDragStart: (id: string) => void;
  onDropOnPage: (id: string) => void;
  isFavorite: (worldId: string | null, pageId: string) => boolean;
  onToggleFavorite: (pageId: string) => void;
}

function renderNode(props: RenderNodeProps): JSX.Element {
  const {
    node,
    depth,
    currentWorldId,
    currentPageId,
    collapsed,
    editingPageId,
    editingTitle,
    setEditingPageId,
    setEditingTitle,
    renamePage,
    onToggleCollapse,
    onPageClick,
    onDotsClick,
    onDragStart,
    onDropOnPage,
    isFavorite,
    onToggleFavorite,
  } = props;

  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsed[node._id] ?? false;
  const isActive = currentPageId === node._id;
  const isEditing = editingPageId === node._id;
  const fav = currentWorldId ? isFavorite(currentWorldId, node._id) : false;

  return (
    <div key={node._id}>
      <div
        className={`group flex items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] cursor-pointer select-none ${
          isActive
            ? "bg-indigo-500/20 text-indigo-200"
            : "text-slate-300 hover:bg-white/5"
        }`}
        style={{ paddingLeft: 8 + depth * 12 }}
        draggable
        onDragStart={() => onDragStart(node._id)}
        onDrop={(e) => {
          e.stopPropagation();
          onDropOnPage(node._id);
        }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => {
          if (!isEditing) onPageClick(node._id);
        }}
      >
        {/* Collapse toggle */}
        {hasChildren ? (
          <button
            className="w-3 h-3 flex items-center justify-center text-[8px] text-slate-500 mr-1"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(node._id);
            }}
          >
            {isCollapsed ? "▶" : "▼"}
          </button>
        ) : (
          <span className="w-3 mr-1" />
        )}

        {/* Emoji */}
        <span className="w-4 text-xs">{node.emoji || "📄"}</span>

        {/* Title / inline edit */}
        {isEditing ? (
          <input
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-[10px] text-slate-100"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onBlur={() => {
              renamePage(node._id, editingTitle);
              setEditingPageId(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                renamePage(node._id, editingTitle);
                setEditingPageId(null);
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setEditingPageId(null);
              }
            }}
          />
        ) : (
          <span className="truncate flex-1">{node.title || "New Page"}</span>
        )}

        {/* Star (favorites) */}
        {!isEditing && currentWorldId && (
          <button
            className={`w-4 h-4 flex items-center justify-center text-[11px] mr-1 transition-opacity ${
              fav
                ? "text-yellow-300 opacity-100"
                : "text-slate-500 opacity-0 group-hover:opacity-100"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(node._id);
            }}
            title={fav ? "Unstar page" : "Star page"}
          >
            {fav ? "★" : "☆"}
          </button>
        )}

        {/* Dots */}
        {!isEditing && (
          <button
            className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded-full hover:bg-white/10 text-[12px] text-slate-400"
            onClick={(e) => onDotsClick(e, node._id)}
          >
            ⋯
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && !isCollapsed && (
        <div className="space-y-0.5">
          {node.children.map((child) =>
            renderNode({
              node: child,
              depth: depth + 1,
              currentWorldId,
              currentPageId,
              collapsed,
              editingPageId,
              editingTitle,
              setEditingPageId,
              setEditingTitle,
              renamePage,
              onToggleCollapse,
              onPageClick,
              onDotsClick,
              onDragStart,
              onDropOnPage,
              isFavorite,
              onToggleFavorite,
            })
          )}
        </div>
      )}
    </div>
  );
}
