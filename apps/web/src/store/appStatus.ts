import { create } from "zustand";

interface AppStatusState {
  isSaving: boolean;
  lastSavedAt: string | null;
  startSaving: () => void;
  finishSaving: () => void;
  setSaving: (v: boolean) => void;
  setSavedNow: () => void;
}

export const useAppStatus = create<AppStatusState>((set) => ({
  isSaving: false,
  lastSavedAt: null,
  setSaving: (v) => set({ isSaving: v }),
  setSavedNow: () =>
    set({ lastSavedAt: new Date().toISOString(), isSaving: false }),
  startSaving: () => set({ isSaving: true }),
  finishSaving: () =>
    set({
      isSaving: false,
      lastSavedAt: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }),
}));
