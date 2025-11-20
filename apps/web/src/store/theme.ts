import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";

interface ThemeState {
  interfaceTheme: Theme;
  editorTheme: Theme;
  setInterfaceTheme: (theme: Theme) => void;
  setEditorTheme: (theme: Theme) => void;
  toggleInterfaceTheme: () => void;
  toggleEditorTheme: () => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      interfaceTheme: "dark",
      editorTheme: "dark",

      setInterfaceTheme: (theme) => set({ interfaceTheme: theme }),
      setEditorTheme: (theme) => set({ editorTheme: theme }),

      toggleInterfaceTheme: () =>
        set((state) => ({
          interfaceTheme: state.interfaceTheme === "dark" ? "light" : "dark",
        })),

      toggleEditorTheme: () =>
        set((state) => ({
          editorTheme: state.editorTheme === "dark" ? "light" : "dark",
        })),
    }),
    {
      name: "world-builder-theme",
    }
  )
);
