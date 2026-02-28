import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../_lib/respond.js";
import { ObjectId } from "../_lib/db.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
}
