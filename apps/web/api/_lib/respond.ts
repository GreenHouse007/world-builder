import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "./auth.js";
import { ObjectId, getCollections, type Collections } from "./db.js";

export function parseRouteParams(rawParams: unknown): string[] {
  return Array.isArray(rawParams) ? rawParams : rawParams ? [rawParams as string] : [];
}

export function parseObjectId(id: string): ObjectId | null {
  try { return new ObjectId(id); } catch { return null; }
}

export async function withAuth(
  req: VercelRequest,
  res: VercelResponse,
  methods: string[],
  fn: (
    user: { uid: string; email?: string; name?: string },
    collections: Collections
  ) => Promise<void>
): Promise<void> {
  if (!methods.includes(req.method ?? "")) {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const user = await verifyToken(req.headers.authorization);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const cols = await getCollections();
    await fn(user, cols);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}
