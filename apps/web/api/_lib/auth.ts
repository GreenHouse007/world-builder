import {
  initializeApp,
  getApps,
  applicationDefault,
  cert,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export function initFirebase() {
  if (getApps().length) return;

  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (key) {
    try {
      const serviceAccount = JSON.parse(key);
      initializeApp({
        credential: cert(serviceAccount),
      });
      return;
    } catch (err) {
      console.error("[auth] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY", err);
    }
  }

  initializeApp({
    credential: applicationDefault(),
  });
}

export async function verifyToken(
  authHeader: string | undefined
): Promise<{ uid: string; email?: string; name?: string } | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  initFirebase();
  try {
    const decoded = await getAuth().verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
    };
  } catch {
    return null;
  }
}
