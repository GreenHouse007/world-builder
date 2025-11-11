import { StrictMode, useEffect, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { onIdTokenChanged } from "firebase/auth";

import { router } from "./app/router";
import { auth } from "./lib/firebase";
import { useAuth } from "./store/auth";
import "./index.css";

const qc = new QueryClient();

// Exported so react-refresh is happy
export function AuthBootstrap({ children }: { children: ReactNode }) {
  const setUser = useAuth((s) => s.setUser);

  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null, null);
        return;
      }
      const token = await fbUser.getIdToken();
      setUser(
        {
          uid: fbUser.uid,
          name: fbUser.displayName,
          email: fbUser.email,
          photoURL: fbUser.photoURL,
        },
        token
      );
    });
    return () => unsub();
  }, [setUser]);

  return <>{children}</>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <AuthBootstrap>
        <RouterProvider router={router} />
      </AuthBootstrap>
    </QueryClientProvider>
  </StrictMode>
);
