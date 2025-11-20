import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../services/http";

export interface World {
  _id: string;
  name: string;
  emoji?: string;
  ownerUid: string;
  members?: { uid: string; role: string }[];
  stats?: {
    pageCount?: number;
    favoriteCount?: number;
    collaboratorCount?: number;
  };
  createdAt?: string;
  updatedAt?: string;
  lastActivityAt?: string;
}

interface WorldsState {
  worlds: World[];
  currentWorldId: string | null;
  loading: boolean;
  error: string | null;

  fetchWorlds: () => Promise<void>;
  createWorld: (name?: string, emoji?: string) => Promise<World | null>;
  duplicateWorld: (worldId: string) => Promise<World | null>;
  renameWorld: (worldId: string, newName: string) => Promise<void>;
  updateWorldIcon: (worldId: string, icon: string) => Promise<void>;
  deleteWorld: (worldId: string) => Promise<void>;
  setWorld: (id: string | null) => void;
}

let fetchingWorlds = false; // single-flight
let fetchTimer: ReturnType<typeof setTimeout> | null = null; // debounce
const FETCH_DEBOUNCE_MS = 250;

export const useWorlds = create<WorldsState>()(
  persist(
    (set, get) => ({
      worlds: [],
      currentWorldId: null,
      loading: false,
      error: null,

  async fetchWorlds() {
    // debounce
    if (fetchTimer) clearTimeout(fetchTimer);
    await new Promise<void>((resolve) => {
      fetchTimer = setTimeout(async () => {
        fetchTimer = null;

        // single-flight
        if (fetchingWorlds) return resolve();
        fetchingWorlds = true;

        if (import.meta.env.DEV)
          console.log("[WORLDS] fetchWorlds() debounced call");

        set({ loading: true, error: null });
        try {
          const data = await api<World[]>("/worlds");
          if (import.meta.env.DEV) console.log("[WORLDS] fetched:", data);

          set({ worlds: data, loading: false });

          // auto-select first world if none selected
          const { currentWorldId } = get();
          if (!currentWorldId && data.length > 0) {
            if (import.meta.env.DEV)
              console.log("[WORLDS] auto-select:", data[0]._id);
            set({ currentWorldId: data[0]._id });
          }
        } catch (err) {
          console.error("[WORLDS] fetch error:", err);
          set({ error: "Failed to fetch worlds", loading: false });
        } finally {
          fetchingWorlds = false;
          resolve();
        }
      }, FETCH_DEBOUNCE_MS);
    });
  },

  async createWorld(name = "New World", emoji = "") {
    if (import.meta.env.DEV) console.log("[WORLDS] createWorld()", name);
    try {
      const newWorld = await api<World>("/worlds", {
        method: "POST",
        body: JSON.stringify({ name, emoji }),
      });
      set((state) => ({
        worlds: [...state.worlds, newWorld],
        currentWorldId: newWorld._id,
      }));
      return newWorld;
    } catch (err) {
      console.error("[WORLDS] create error:", err);
      return null;
    }
  },

  async duplicateWorld(worldId) {
    if (import.meta.env.DEV) console.log("[WORLDS] duplicateWorld()", worldId);
    try {
      const duplicatedWorld = await api<World>(`/worlds/${worldId}/duplicate`, {
        method: "POST",
      });
      set((state) => ({
        worlds: [...state.worlds, duplicatedWorld],
        currentWorldId: duplicatedWorld._id,
      }));
      return duplicatedWorld;
    } catch (err) {
      console.error("[WORLDS] duplicate error:", err);
      return null;
    }
  },

  async renameWorld(worldId, newName) {
    try {
      await api(`/worlds/${worldId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: newName }),
      });
      set((state) => ({
        worlds: state.worlds.map((w) =>
          w._id === worldId ? { ...w, name: newName } : w
        ),
      }));
    } catch (err) {
      console.error("[WORLDS] rename error:", err);
    }
  },

  async updateWorldIcon(worldId, icon) {
    try {
      await api(`/worlds/${worldId}`, {
        method: "PATCH",
        body: JSON.stringify({ emoji: icon }),
      });
      set((state) => ({
        worlds: state.worlds.map((w) =>
          w._id === worldId ? { ...w, emoji: icon } : w
        ),
      }));
    } catch (err) {
      console.error("[WORLDS] icon update error:", err);
    }
  },

  async deleteWorld(worldId) {
    try {
      await api(`/worlds/${worldId}`, { method: "DELETE" });
      set((state) => {
        const worlds = state.worlds.filter((w) => w._id !== worldId);
        const nextId =
          state.currentWorldId === worldId
            ? worlds[0]?._id ?? null
            : state.currentWorldId;
        return { worlds, currentWorldId: nextId };
      });
    } catch (err) {
      console.error("[WORLDS] delete error:", err);
    }
  },

  setWorld(id) {
    if (import.meta.env.DEV) console.log("[WORLDS] setWorld()", id);
    set({ currentWorldId: id });

    // Update lastActivityAt for this world
    if (id) {
      const now = new Date().toISOString();
      set((state) => ({
        worlds: state.worlds.map((w) =>
          w._id === id ? { ...w, lastActivityAt: now } : w
        ),
      }));

      // Optionally sync with backend
      api(`/worlds/${id}/activity`, {
        method: "PATCH",
        body: JSON.stringify({ lastActivityAt: now }),
      }).catch((err) => {
        if (import.meta.env.DEV)
          console.log("[WORLDS] activity update skipped or failed:", err);
      });
    }
  },
}),
    {
      name: "world-builder-worlds",
      partialize: (state) => ({ currentWorldId: state.currentWorldId }),
    }
  )
);
