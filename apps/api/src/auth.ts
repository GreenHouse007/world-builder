// apps/api/src/auth.ts
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
      console.log(
        "[auth] Initialized Firebase Admin with FIREBASE_SERVICE_ACCOUNT_KEY"
      );
      return;
    } catch (err) {
      console.error("[auth] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY", err);
    }
  }

  // fallback to ADC
  initializeApp({
    credential: applicationDefault(),
  });
  console.log("[auth] Initialized Firebase Admin with applicationDefault()");
}

export async function verifyBearer(token?: string) {
  if (!token) return null;
  try {
    return await getAuth().verifyIdToken(token);
  } catch (err) {
    console.error("verifyBearer error", err);
    return null;
  }
}
