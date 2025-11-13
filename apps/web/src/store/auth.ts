// apps/web/src/store/auth.ts
import { create } from "zustand";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "../lib/firebase";

interface AuthUser {
  uid: string;
  email?: string | null;
  name?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  idToken: string | null;
  loading: boolean;

  setUserFromFirebase: (fbUser: User | null) => Promise<void>;
  setIdToken: (token: string | null) => void;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  idToken: null,
  loading: true,

  setUserFromFirebase: async (fbUser) => {
    if (!fbUser) {
      console.log("[AUTH] setUserFromFirebase: null (signed out)");
      set({ user: null, idToken: null, loading: false });
      return;
    }

    const token = await fbUser.getIdToken();
    console.log("[AUTH] Firebase user detected:", fbUser.uid, fbUser.email);

    set({
      user: {
        uid: fbUser.uid,
        email: fbUser.email,
        name: fbUser.displayName || fbUser.email || "Explorer",
      },
      idToken: token,
      loading: false,
    });
    console.log(
      "[AUTH] Zustand state updated with token prefix:",
      token.slice(0, 8)
    );
  },

  logout: async () => {
    console.log("[AUTH] logout() called");
    await signOut(auth);
    set({ user: null, idToken: null, loading: false });
    console.log("[AUTH] logout() completed");
  },

  setIdToken: (token) => set({ idToken: token }),
}));

// Single auth bootstrap
onAuthStateChanged(auth, (fbUser) => {
  void useAuth.getState().setUserFromFirebase(fbUser);
});
