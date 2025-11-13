import { create } from "zustand";
import { api } from "../services/http";

export interface PageNode {
  _id: string;
  worldId: string;
  title: string;
  parentId: string | null;
  position: number; // server uses "position"
  emoji?: string;
  isCollapsed?: boolean; // UI-only
  isFavorite?: boolean; // UI-only
  // computed at fetch time
  children?: PageNode[];
}

interface PagesState {
  pages: PageNode[]; // flat
  tree: PageNode[]; // nested
  currentPageId: string | null;
  loading: boolean;
  error: string | null;

  fetchPages: (worldId: string) => Promise<void>;
  createPage: (
    worldId: string,
    parentId?: string | null
  ) => Promise<PageNode | null>;
  renamePage: (id: string, title: string) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  duplicatePage: (id: string) => Promise<PageNode | null>;
  movePage: (id: string, newParentId: string | null) => Promise<void>;
  toggleCollapse: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  setCurrentPage: (id: string | null) => void;
  applyFilter: (q: string) => void; // client-side filter
  filteredIds: Set<string>; // ids visible for search
}

function toTree(nodes: PageNode[]): PageNode[] {
  const map = new Map<string, PageNode>();
  nodes.forEach((n) => map.set(n._id, { ...n, children: [] }));
  const roots: PageNode[] = [];
  nodes.forEach((n) => {
    const m = map.get(n._id)!;
    if (n.parentId) {
      const p = map.get(n.parentId);
      if (p) p.children!.push(m);
    } else {
      roots.push(m);
    }
  });
  const sortRec = (arr: PageNode[]) => {
    arr.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    arr.forEach((c) => sortRec(c.children!));
  };
  sortRec(roots);
  return roots;
}

export const usePages = create<PagesState>((set, get) => ({
  pages: [],
  tree: [],
  currentPageId: null,
  loading: false,
  error: null,
  filteredIds: new Set<string>(),

  async fetchPages(worldId) {
    set({ loading: true, error: null });
    try {
      const data = await api<PageNode[]>(`/worlds/${worldId}/pages`);
      const normalized = data.map((p) => ({
        ...p,
        position:
          typeof p.position === "number" ? p.position : Number(p.position) || 0,
      }));
      const tree = toTree(normalized);
      set({ pages: normalized, tree, loading: false, filteredIds: new Set() });
    } catch (e) {
      console.error("[PAGES] fetch error", e);
      set({ error: "Failed to load pages", loading: false });
    }
  },

  async createPage(worldId, parentId = null) {
    try {
      const newPage = await api<PageNode>("/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worldId, parentId, title: "New Page" }),
      });
      const normalized = {
        ...newPage,
        position:
          typeof newPage.position === "number"
            ? newPage.position
            : Number(newPage.position) || 0,
      };
      set((s) => {
        const pages = [...s.pages, normalized];
        return { pages, tree: toTree(pages) };
      });
      return normalized;
    } catch (e) {
      console.error("[PAGES] create error", e);
      return null;
    }
  },

  async renamePage(id, title) {
    try {
      const trimmed = title.trim();
      if (!trimmed) return;
      await api(`/pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      set((s) => {
        const pages = s.pages.map((p) =>
          p._id === id ? { ...p, title: trimmed } : p
        );
        return { pages, tree: toTree(pages) };
      });
    } catch (e) {
      console.error("[PAGES] rename error", e);
    }
  },

  async deletePage(id) {
    try {
      await api(`/pages/${id}`, { method: "DELETE" });
      set((s) => {
        const omit = new Set<string>([id]);
        const walk = (pid: string) => {
          s.pages.forEach((p) => {
            if (p.parentId === pid) {
              omit.add(p._id);
              walk(p._id);
            }
          });
        };
        walk(id);
        const pages = s.pages.filter((p) => !omit.has(p._id));
        return { pages, tree: toTree(pages) };
      });
    } catch (e) {
      console.error("[PAGES] delete error", e);
    }
  },

  async duplicatePage(id) {
    try {
      const clone = await api<PageNode>(`/pages/${id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const normalized = {
        ...clone,
        position:
          typeof clone.position === "number"
            ? clone.position
            : Number(clone.position) || 0,
      };
      set((s) => {
        const pages = [...s.pages, normalized];
        return { pages, tree: toTree(pages) };
      });
      return normalized;
    } catch (e) {
      console.error("[PAGES] duplicate error", e);
      return null;
    }
  },

  async movePage(id, newParentId) {
    try {
      await api(`/pages/${id}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: newParentId }),
      });

      // Update local state
      set((s) => {
        const siblingPositions = s.pages
          .filter((p) => p.parentId === newParentId)
          .map((p) => p.position ?? 0);
        const nextPos =
          (siblingPositions.length ? Math.max(...siblingPositions) : 0) + 1;

        const pages = s.pages.map((p) =>
          p._id === id ? { ...p, parentId: newParentId, position: nextPos } : p
        );
        return { pages, tree: toTree(pages) };
      });
    } catch (e) {
      console.error("[PAGES] move error", e);
    }
  },

  async toggleCollapse(id) {
    set((s) => {
      const pages = s.pages.map((p) =>
        p._id === id ? { ...p, isCollapsed: !p.isCollapsed } : p
      );
      return { pages, tree: toTree(pages) };
    });
  },

  async toggleFavorite(id) {
    set((s) => {
      const pages = s.pages.map((p) =>
        p._id === id ? { ...p, isFavorite: !p.isFavorite } : p
      );
      return { pages, tree: toTree(pages) };
    });
  },

  setCurrentPage(id) {
    set({ currentPageId: id });
  },

  applyFilter(q) {
    const term = q.trim().toLowerCase();
    if (!term) return set({ filteredIds: new Set() });
    const ids = new Set<string>();
    const { pages } = get();
    for (const p of pages) {
      if (p.title.toLowerCase().includes(term)) ids.add(p._id);
    }
    set({ filteredIds: ids });
  },
}));
