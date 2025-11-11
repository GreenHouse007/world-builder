import { create } from "zustand";
import type { World } from "../types";
import { api } from "../services/http";
import { usePages } from "./pages";

interface WorldsState {
  worlds: World[];
  currentWorldId: string | null;
  loading: boolean;

  fetchWorlds: () => Promise<void>;
  createWorld: (name: string, emoji?: string) => Promise<void>;
  setWorld: (id: string) => void;
  renameWorld: (id: string, name: string) => Promise<void>;
  deleteWorld: (id: string) => Promise<void>;
  duplicateWorld: (id: string) => Promise<void>;
}

export const useWorlds = create<WorldsState>((set, get) => ({
  worlds: [],
  currentWorldId: null,
  loading: false,

  fetchWorlds: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const data = await api<World[]>("/worlds");
      set({
        worlds: data,
        currentWorldId: data[0]?._id ?? null,
        loading: false,
      });
    } catch (err) {
      console.error(err);
      set({ loading: false });
    }
  },

  createWorld: async (name, emoji) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const created = await api<World>("/worlds", {
      method: "POST",
      body: JSON.stringify({ name: trimmed, emoji }),
    });
    set((state) => ({
      worlds: [...state.worlds, created],
      currentWorldId: created._id,
    }));
    // reset pages for new world
    usePages.getState().setCurrentPage(null);
  },

  setWorld: (id) => {
    set({ currentWorldId: id });
    usePages.getState().setCurrentPage(null);
    usePages.getState().fetchPages(id);
  },

  renameWorld: async (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const updated = await api<World>(`/worlds/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: trimmed }),
    });
    set((state) => ({
      worlds: state.worlds.map((w) =>
        w._id === id ? { ...w, name: updated.name } : w
      ),
    }));
  },

  deleteWorld: async (id) => {
    await api(`/worlds/${id}`, { method: "DELETE" });
    set((state) => {
      const worlds = state.worlds.filter((w) => w._id !== id);
      const currentWorldId =
        state.currentWorldId === id
          ? worlds[0]?._id ?? null
          : state.currentWorldId;
      if (state.currentWorldId === id) {
        usePages.getState().setCurrentPage(null);
        if (currentWorldId) usePages.getState().fetchPages(currentWorldId);
      }
      return { worlds, currentWorldId };
    });
  },

  duplicateWorld: async (id) => {
    const copy = await api<World>(`/worlds/${id}/duplicate`, {
      method: "POST",
    });
    set((state) => ({
      worlds: [...state.worlds, copy],
      currentWorldId: copy._id,
    }));
    usePages.getState().setCurrentPage(null);
    usePages.getState().fetchPages(copy._id);
  },
}));
