import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../_lib/respond";
import { ObjectId } from "../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await withAuth(req, res, ["DELETE"], async (user, { Pages, Worlds, Favorites }) => {
    const pageId = req.query.pageId as string;
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
