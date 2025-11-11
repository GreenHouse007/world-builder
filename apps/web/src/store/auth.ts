import { create } from "zustand";

interface User {
  uid: string;
  name: string | null;
  email: string | null;
  photoURL?: string | null;
}

interface AuthState {
  user: User | null;
  idToken: string | null;
  setUser: (u: User | null, token: string | null) => void;
  clear: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  idToken: null,
  setUser: (user, idToken) => set({ user, idToken }),
  clear: () => set({ user: null, idToken: null }),
}));
