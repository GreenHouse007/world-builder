import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../store/auth";
import { useWorlds } from "../../store/worlds";
import { usePages } from "../../store/pages";
import { DndTree } from "./DndTree";

/** Match the type used in DndTree */
type PageNode = {
  _id: string;
  title: string;
  isCollapsed?: boolean;
  children?: PageNode[];
};

export function Sidebar() {
  const { user } = useAuth();
  const { currentWorldId } = useWorlds();
  const { tree, loading, fetchPages, createPage } = usePages();

  const [query, setQuery] = useState("");

  useEffect(() => {
    if (currentWorldId) void fetchPages(currentWorldId);
  }, [currentWorldId, fetchPages]);

  const filterVisible = (id: string) => {
    if (!query.trim()) return true;
    const node = findInTree(tree as PageNode[], id);
    return node
      ? node.title.toLowerCase().includes(query.toLowerCase())
      : false;
  };

  const filteredTree: PageNode[] = useMemo(() => {
    const nodes = (tree as PageNode[]) ?? [];
    if (!query.trim()) return nodes;

    const lower = query.toLowerCase();
    const filter = (n: PageNode): PageNode | null => {
      const self = n.title.toLowerCase().includes(lower);
      const kids = (n.children ?? [])
        .map(filter)
        .filter((x): x is PageNode => Boolean(x));
      if (self || kids.length) return { ...n, children: kids };
      return null;
    };

    return nodes.map(filter).filter((x): x is PageNode => Boolean(x));
  }, [tree, query]);

  const disabled = !currentWorldId;

  return (
    <aside className="w-72 border-r border-white/5 bg-[#050814]/60 backdrop-blur-xl p-3 flex flex-col gap-3">
      {/* User card */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
        <div className="text-xs text-slate-400">Signed in</div>
        <div className="font-medium text-slate-100">
          {user?.name ?? user?.email ?? "Explorer"}
        </div>
        <div className="text-[10px] text-slate-500">{user?.email}</div>
      </div>

      {/* Dashboard quick link */}
      <button
        className="w-full rounded-xl px-3 py-2 bg-white/5 hover:bg-white/10 text-sm text-slate-100 text-left"
        onClick={() => {
          window.history.pushState(null, "", "/");
          window.dispatchEvent(new PopStateEvent("popstate"));
        }}
      >
        🏠 Dashboard
      </button>

      {/* Pages header: label + search + + */}
      <div className="mt-1">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">
            Pages
          </div>
          <button
            disabled={disabled}
            onClick={async () => {
              if (!currentWorldId) return;
              await createPage(currentWorldId, null);
            }}
            className="h-7 px-2 rounded-lg bg-indigo-500/90 hover:bg-indigo-500 text-white text-sm disabled:opacity-50"
            title="New page"
          >
            +
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter pages…"
            className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 outline-none text-sm text-slate-100"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200"
              title="Clear"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Pages tree (DnD) */}
      <div className="flex-1 overflow-auto rounded-xl border border-white/5 p-2">
        {disabled ? (
          <div className="text-xs text-slate-500">
            Select or create a world to add pages.
          </div>
        ) : loading ? (
          <div className="text-xs text-slate-500">Loading pages…</div>
        ) : filteredTree.length === 0 ? (
          <div className="text-xs text-slate-500">
            {query
              ? `No results for “${query}”.`
              : "No pages yet — press + to create one."}
          </div>
        ) : (
          <DndTree tree={filteredTree} filterVisible={filterVisible} />
        )}
      </div>

      {/* Info box */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-[11px] text-slate-400">
        <div className="font-medium text-slate-200 mb-1">Insight</div>
        Export your world bible as a polished PDF or publish a live portal.
        Autosave is on.
      </div>
    </aside>
  );
}

function findInTree(tree: PageNode[], id: string): PageNode | null {
  for (const n of tree) {
    if (n._id === id) return n;
    if (n.children?.length) {
      const c = findInTree(n.children, id);
      if (c) return c;
    }
  }
  return null;
}
