import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "./auth.js";
import { getCollections, type Collections } from "./db.js";

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
