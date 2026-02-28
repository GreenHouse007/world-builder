import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../_lib/respond";
import { ObjectId } from "../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawParams = req.query.params;
  const params = Array.isArray(rawParams) ? rawParams : rawParams ? [rawParams] : [];
  const [pageId] = params;

  if (!pageId) {
    // POST /api/favorites — create a favorite
    await withAuth(req, res, ["POST"], async (user, { Worlds, Pages, Favorites }) => {
      const { worldId, pageId: bodyPageId } = req.body as { worldId: string; pageId: string };
      const uid = user.uid;

      let worldObjectId: ObjectId;
      let pageObjectId: ObjectId;
      try {
        worldObjectId = new ObjectId(worldId);
        pageObjectId = new ObjectId(bodyPageId);
      } catch {
        res.status(400).json({ error: "invalid ids" }); return;
      }

      const page = await Pages.findOne({ _id: pageObjectId, worldId: worldObjectId });
      if (!page) { res.status(404).json({ error: "page not found in world" }); return; }

      const world = await Worlds.findOne({ _id: worldObjectId, $or: [{ ownerUid: uid }, { "members.uid": uid }] });
      if (!world) { res.status(403).json({ error: "forbidden" }); return; }

      const existing = await Favorites.findOne({ uid, worldId: worldObjectId, pageId: pageObjectId });
      if (existing) { res.status(200).json({ ok: true }); return; }

      const now = new Date();
      await Favorites.insertOne({ _id: new ObjectId(), uid, worldId: worldObjectId, pageId: pageObjectId, createdAt: now });
      await Worlds.updateOne({ _id: worldObjectId }, { $inc: { "stats.favoriteCount": 1 }, $set: { updatedAt: now } });

      res.status(200).json({ ok: true });
    });
    return;
  }

  // DELETE /api/favorites/:pageId — remove a favorite
  await withAuth(req, res, ["DELETE"], async (user, { Pages, Worlds, Favorites }) => {
    const uid = user.uid;

    let pageObjectId: ObjectId;
    try {
      pageObjectId = new ObjectId(pageId);
    } catch {
      res.status(400).json({ error: "invalid pageId" }); return;
    }

    const page = await Pages.findOne({ _id: pageObjectId });
    if (!page) { res.status(404).json({ error: "page not found" }); return; }

    const worldObjectId = page.worldId;
    const result = await Favorites.deleteOne({ uid, pageId: pageObjectId, worldId: worldObjectId });
    if (result.deletedCount) {
      await Worlds.updateOne({ _id: worldObjectId }, { $inc: { "stats.favoriteCount": -1 } });
    }

    res.status(200).json({ ok: true });
  });
}
