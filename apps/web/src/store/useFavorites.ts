import { create } from "zustand";
import { api } from "../services/http";

interface Favorite {
  pageId: string;
  worldId: string;
  title?: string;
  createdAt: string;
}

interface FavoritesState {
  byWorld: Record<string, Set<string>>;
  isLoading: boolean;

  fetchFavorites: (worldId: string) => Promise<void>;
  isFavorite: (worldId: string | null, pageId: string) => boolean;
  toggleFavorite: (worldId: string | null, pageId: string) => Promise<void>;
}

export const useFavorites = create<FavoritesState>((set, get) => ({
  byWorld: {},
  isLoading: false,

  async fetchFavorites(worldId: string) {
    if (!worldId) return;
    set({ isLoading: true });

    try {
      const data = await api<Favorite[]>(`/worlds/${worldId}/favorites`);
      const setForWorld = new Set<string>(data.map((f) => f.pageId));

      set((state) => ({
        byWorld: {
          ...state.byWorld,
          [worldId]: setForWorld,
        },
        isLoading: false,
      }));
    } catch (err) {
      console.error("Failed to fetch favorites", err);
      set({ isLoading: false });
    }
  },

  isFavorite(worldId, pageId) {
    if (!worldId) return false;
    const state = get();
    const setForWorld = state.byWorld[worldId];
    return !!setForWorld && setForWorld.has(pageId);
  },

  async toggleFavorite(worldId, pageId) {
    if (!worldId) return;
    const { isFavorite } = get();
    const currentlyFav = isFavorite(worldId, pageId);

    // Optimistic update
    set((state) => {
      const existing = state.byWorld[worldId] || new Set<string>();
      const next = new Set(existing);
      if (currentlyFav) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return {
        byWorld: {
          ...state.byWorld,
          [worldId]: next,
        },
      };
    });

    try {
      if (currentlyFav) {
        await api<{ ok: boolean }>(`/favorites/${pageId}`, {
          method: "DELETE",
        });
      } else {
        await api<{ ok: boolean }>("/favorites", {
          method: "POST",
          body: JSON.stringify({ worldId, pageId }),
        });
      }
    } catch (err) {
      console.error("Failed to toggle favorite", err);
      // If API fails, revert
      set((state) => {
        const existing = state.byWorld[worldId] || new Set<string>();
        const next = new Set(existing);
        if (currentlyFav) {
          // we tried to remove but failed → add back
          next.add(pageId);
        } else {
          // we tried to add but failed → remove
          next.delete(pageId);
        }
        return {
          byWorld: {
            ...state.byWorld,
            [worldId]: next,
          },
        };
      });
    }
  },
}));
