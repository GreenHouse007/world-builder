import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth, parseRouteParams, parseObjectId } from "../_lib/respond.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const params = parseRouteParams(req.query.params);
  const [pageId] = params;

  if (!pageId) {
    res.status(404).json({ error: "not found" });
    return;
  }

  await withAuth(req, res, ["DELETE"], async (user, { Pages, Worlds, Favorites }) => {
    const uid = user.uid;

    const pageObjectId = parseObjectId(pageId);
    if (!pageObjectId) { res.status(400).json({ error: "invalid pageId" }); return; }

    const page = await Pages.findOne({ _id: pageObjectId });
    if (!page) { res.status(404).json({ error: "page not found" }); return; }

    const worldObjectId = page.worldId;
    const world = await Worlds.findOne({ _id: worldObjectId, $or: [{ ownerUid: uid }, { "members.uid": uid }] });
    if (!world) { res.status(403).json({ error: "forbidden" }); return; }

    const result = await Favorites.deleteOne({ uid, pageId: pageObjectId, worldId: worldObjectId });
    if (result.deletedCount) {
      await Worlds.updateOne({ _id: worldObjectId }, { $inc: { "stats.favoriteCount": -1 } });
    }

    res.status(200).json({ ok: true });
  });
}
