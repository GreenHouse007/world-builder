import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../store/auth";
import { useWorlds } from "../../store/worlds";
import { usePages } from "../../store/pages";
import { useTheme } from "../../store/theme";
import { useUI } from "../../store/ui";
import { DndTree } from "./DndTree";
import { ExportModal } from "../export/ExportModal";

/** Match the type used in DndTree */
type PageNode = {
  _id: string;
  title: string;
  isCollapsed?: boolean;
  children?: PageNode[];
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const { currentWorldId } = useWorlds();
  const { tree, loading, fetchPages, createPage } = usePages();
  const { interfaceTheme } = useTheme();
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useUI();

  const [query, setQuery] = useState("");
  const [showExport, setShowExport] = useState(false);

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
    <>
      {/* Mobile overlay backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-80 lg:w-96
        transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        border-r p-3 flex flex-col gap-3
        ${interfaceTheme === "dark"
          ? "border-white/5 bg-[#050814] backdrop-blur-xl"
          : "border-gray-200 bg-white backdrop-blur-xl shadow-sm"
        }
      `}>
      {/* Mobile close button */}
      <button
        className={`lg:hidden self-end p-2 rounded-lg ${
          interfaceTheme === "dark"
            ? "text-slate-400 hover:bg-white/10"
            : "text-gray-600 hover:bg-gray-100"
        }`}
        onClick={() => setMobileSidebarOpen(false)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* User card */}
      <button
        onClick={() => {
          usePages.getState().setCurrentPage("settings");
          setMobileSidebarOpen(false);
        }}
        className={`w-full rounded-2xl border p-3 transition-colors text-left ${
          interfaceTheme === "dark"
            ? "bg-white/5 border-white/10 hover:bg-white/10"
            : "bg-blue-50 border-blue-200 hover:bg-blue-100"
        }`}
      >
        <div className={`text-xs ${interfaceTheme === "dark" ? "text-slate-400" : "text-blue-700"}`}>
          Signed in
        </div>
        <div className={`font-medium ${interfaceTheme === "dark" ? "text-slate-100" : "text-gray-900"}`}>
          {user?.name ?? user?.email ?? "Explorer"}
        </div>
        <div className={`text-[10px] ${interfaceTheme === "dark" ? "text-slate-500" : "text-gray-700"}`}>
          {user?.email}
        </div>
      </button>

      {/* Dashboard quick link */}
      <button
        className={`w-full rounded-xl px-3 py-2 text-sm text-left transition-colors ${
          interfaceTheme === "dark"
            ? "bg-white/5 hover:bg-white/10 text-slate-100"
            : "bg-gray-100 hover:bg-gray-200 text-gray-900"
        }`}
        onClick={() => {
          usePages.getState().setCurrentPage(null);
          setMobileSidebarOpen(false);
        }}
      >
        🏠 Dashboard
      </button>

      {/* Mobile-only Export & Sign Out buttons */}
      <div className="md:hidden flex gap-2">
        <button
          onClick={() => {
            setShowExport(true);
            setMobileSidebarOpen(false);
          }}
          className={`flex-1 rounded-xl px-3 py-2 text-sm transition-colors ${
            interfaceTheme === "dark"
              ? "bg-white/5 hover:bg-white/10 text-slate-200"
              : "bg-gray-100 hover:bg-gray-200 text-gray-900"
          }`}
        >
          📤 Export
        </button>
        <button
          onClick={() => {
            logout();
            setMobileSidebarOpen(false);
          }}
          className={`flex-1 rounded-xl px-3 py-2 text-sm transition-colors ${
            interfaceTheme === "dark"
              ? "bg-white/5 hover:bg-white/10 text-slate-200"
              : "bg-gray-100 hover:bg-gray-200 text-gray-900"
          }`}
        >
          🚪 Sign Out
        </button>
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}

      {/* Pages header: label + search + + */}
      <div className="mt-1">
        <div className="flex items-center justify-between mb-2">
          <div className={`text-[10px] uppercase tracking-wider ${
            interfaceTheme === "dark" ? "text-slate-500" : "text-gray-600"
          }`}>
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
            className={`flex-1 px-3 py-2 rounded-xl outline-none text-sm ${
              interfaceTheme === "dark"
                ? "bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-500"
                : "bg-white border border-gray-300 text-gray-900 placeholder:text-gray-500"
            }`}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className={`w-9 h-9 rounded-xl ${
                interfaceTheme === "dark"
                  ? "bg-white/5 hover:bg-white/10 text-slate-200"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-900"
              }`}
              title="Clear"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Pages tree (DnD) */}
      <div className={`flex-1 overflow-auto rounded-xl border p-2 ${
        interfaceTheme === "dark"
          ? "border-white/5"
          : "border-gray-200 bg-gray-50/50"
      }`}>
        {disabled ? (
          <div className={`text-xs ${
            interfaceTheme === "dark" ? "text-slate-500" : "text-gray-600"
          }`}>
            Select or create a world to add pages.
          </div>
        ) : loading ? (
          <div className={`text-xs ${
            interfaceTheme === "dark" ? "text-slate-500" : "text-gray-600"
          }`}>Loading pages…</div>
        ) : filteredTree.length === 0 ? (
          <div className={`text-xs ${
            interfaceTheme === "dark" ? "text-slate-500" : "text-gray-600"
          }`}>
            {query
              ? `No results for "${query}".`
              : "No pages yet — press + to create one."}
          </div>
        ) : (
          <DndTree tree={filteredTree} filterVisible={filterVisible} />
        )}
      </div>

      {/* Info box */}
      <div className={`rounded-xl border p-3 text-[11px] ${
        interfaceTheme === "dark"
          ? "bg-white/5 border-white/10 text-slate-400"
          : "bg-blue-50 border-blue-200 text-gray-700"
      }`}>
        <div className={`font-medium mb-1 ${
          interfaceTheme === "dark" ? "text-slate-200" : "text-gray-900"
        }`}>Insight</div>
        Export your world bible as a polished PDF or publish a live portal.
        Autosave is on.
      </div>
    </aside>
    </>
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
