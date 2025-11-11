import { create } from "zustand";
import { api } from "../services/http";

export interface Page {
  _id: string;
  worldId: string;
  parentId: string | null;
  title: string;
  emoji?: string;
  position: number;
  createdAt?: string;
  updatedAt?: string;
}

interface PagesState {
  byWorld: Record<string, Page[]>;
  currentPageId: string | null;
  loadingWorldId: string | null;

  setCurrentPage: (pageId: string | null) => void;
  fetchPages: (worldId: string) => Promise<void>;
  createPage: (
    worldId: string,
    title?: string,
    emoji?: string,
    parentId?: string | null
  ) => Promise<Page | null>;
  renamePage: (pageId: string, title: string) => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;
  duplicatePage: (pageId: string) => Promise<void>;
  movePage: (pageId: string, parentId: string | null) => Promise<void>;
}

export const usePages = create<PagesState>((set, get) => ({
  byWorld: {},
  currentPageId: null,
  loadingWorldId: null,

  setCurrentPage: (pageId) => set({ currentPageId: pageId }),

  fetchPages: async (worldId) => {
    const { loadingWorldId } = get();
    if (loadingWorldId === worldId) return;

    set({ loadingWorldId: worldId });
    try {
      const pages = await api<Page[]>(`/worlds/${worldId}/pages`);
      set((state) => ({
        byWorld: { ...state.byWorld, [worldId]: pages },
        loadingWorldId: null,
      }));
    } catch (err) {
      console.error("Failed to fetch pages", err);
      set({ loadingWorldId: null });
    }
  },

  createPage: async (
    worldId,
    title = "New Page",
    emoji = "📄",
    parentId: string | null = null
  ) => {
    try {
      const page = await api<Page>("/pages", {
        method: "POST",
        body: JSON.stringify({ worldId, title, emoji, parentId }),
      });

      set((state) => ({
        byWorld: {
          ...state.byWorld,
          [worldId]: [...(state.byWorld[worldId] || []), page],
        },
        currentPageId: page._id,
      }));

      return page;
    } catch (err) {
      console.error("Failed to create page", err);
      return null;
    }
  },

  renamePage: async (pageId, title) => {
    const trimmed = title.trim() || "New Page";

    try {
      await api<{ ok?: boolean }>(`/pages/${pageId}`, {
        method: "PATCH",
        body: JSON.stringify({ title: trimmed }),
      });
    } catch (err) {
      console.error("Failed to rename page", err);
    }

    set((state) => {
      const byWorld: Record<string, Page[]> = {};
      for (const [worldId, pages] of Object.entries(state.byWorld)) {
        byWorld[worldId] = pages.map((p) =>
          p._id === pageId ? { ...p, title: trimmed } : p
        );
      }
      return { byWorld };
    });
  },

  deletePage: async (pageId) => {
    try {
      await api<{ ok: boolean }>(`/pages/${pageId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to delete page", err);
    }

    // Remove the page and its descendants from local state
    set((state) => {
      const byWorld: Record<string, Page[]> = {};
      let { currentPageId } = state;

      for (const [worldId, pages] of Object.entries(state.byWorld)) {
        const idsToDelete = new Set<string>();

        // build tree index
        const childrenMap: Record<string, string[]> = {};
        for (const p of pages) {
          if (p.parentId) {
            if (!childrenMap[p.parentId]) childrenMap[p.parentId] = [];
            childrenMap[p.parentId].push(p._id);
          }
        }

        const stack: string[] = [pageId];
        while (stack.length) {
          const id = stack.pop() as string;
          if (idsToDelete.has(id)) continue;
          idsToDelete.add(id);
          const kids = childrenMap[id];
          if (kids) stack.push(...kids);
        }

        const filtered = pages.filter((p) => !idsToDelete.has(p._id));
        byWorld[worldId] = filtered;

        if (idsToDelete.has(currentPageId ?? "")) {
          currentPageId = null;
        }
      }

      return { byWorld, currentPageId };
    });
  },

  duplicatePage: async (pageId) => {
    try {
      const copy = await api<Page>(`/pages/${pageId}/duplicate`, {
        method: "POST",
      });

      set((state) => {
        const pages = state.byWorld[copy.worldId] || [];
        return {
          byWorld: {
            ...state.byWorld,
            [copy.worldId]: [...pages, copy],
          },
          currentPageId: copy._id,
        };
      });
    } catch (err) {
      console.error("Failed to duplicate page", err);
    }
  },

  movePage: async (pageId, parentId) => {
    try {
      await api<{ ok: boolean }>(`/pages/${pageId}/move`, {
        method: "PATCH",
        body: JSON.stringify({ parentId }),
      });
    } catch (err) {
      console.error("Failed to move page", err);
    }

    // Optimistic local update
    set((state) => {
      const byWorld: Record<string, Page[]> = {};
      for (const [worldId, pages] of Object.entries(state.byWorld)) {
        byWorld[worldId] = pages.map((p) =>
          p._id === pageId ? { ...p, parentId } : p
        );
      }
      return { byWorld };
    });
  },
}));
