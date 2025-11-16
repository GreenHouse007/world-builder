// apps/web/src/services/http.ts
import { getAuth } from "firebase/auth";
import { useAuth } from "../store/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const authState = useAuth.getState();
  let { idToken } = authState;
  const { user } = authState;

  console.log("[API] starting request:", path, "user:", user?.uid);

  if (!idToken) {
    console.log("[API] No token in store, checking Firebase auth...");
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      idToken = await currentUser.getIdToken();
      console.log("[API] Got fresh token from Firebase:", idToken.slice(0, 8));
      const { setIdToken } = useAuth.getState();
      setIdToken(idToken);
    } else {
      console.warn("[API] No currentUser in Firebase!");
    }
  }

  if (!idToken) {
    console.error("[API] ❌ No idToken available for request:", path);
    throw new Error("No auth token; user is not signed in.");
  }

  console.log("[API] Sending request to", `${API_URL}${path}`);

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
      Authorization: `Bearer ${idToken}`,
    },
  });

  console.log("[API] Response status:", res.status);

  // Handle expired/invalid token -> log out so overlay shows
  if (res.status === 401 || res.status === 403) {
    console.warn("[API] Auth error, signing out to recover...");
    try {
      await getAuth().signOut();
    } catch (e) {
      console.error("[API] signOut error", e);
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[API] ❌ Error response:", res.status, text);
    throw new Error(text || `Request failed: ${res.status}`);
  }

  const json = await res.json();
  console.log("[API] ✅ Success:", path, json);
  return json as T;
}
