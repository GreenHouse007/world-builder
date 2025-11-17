import { create } from "zustand";

interface AppStatusState {
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  isOffline: boolean;
  lastSavedAt: string | null;
  startSaving: () => void;
  finishSaving: () => void;
  setSaving: (v: boolean) => void;
  setSavedNow: () => void;
  setUnsavedChanges: (v: boolean) => void;
  setOffline: (v: boolean) => void;
}

export const useAppStatus = create<AppStatusState>((set) => ({
  isSaving: false,
  hasUnsavedChanges: false,
  isOffline: false,
  lastSavedAt: null,
  setSaving: (v) => set({ isSaving: v }),
  setSavedNow: () =>
    set({ lastSavedAt: new Date().toISOString(), isSaving: false, hasUnsavedChanges: false }),
  startSaving: () => set({ isSaving: true }),
  finishSaving: () =>
    set({
      isSaving: false,
      hasUnsavedChanges: false,
      lastSavedAt: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }),
  setUnsavedChanges: (v) => set({ hasUnsavedChanges: v }),
  setOffline: (v) => set({ isOffline: v }),
}));
