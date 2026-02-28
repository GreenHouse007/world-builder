import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../_lib/respond";
import { ObjectId } from "../../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await withAuth(req, res, ["GET"], async (user, { Worlds, Pages, Favorites }) => {
    const worldId = req.query.worldId as string;
    const uid = user.uid;

    let worldObjectId: ObjectId;
    try {
      worldObjectId = new ObjectId(worldId);
    } catch {
      res.status(400).json({ error: "invalid worldId" }); return;
    }

    const world = await Worlds.findOne({
      _id: worldObjectId,
      $or: [{ ownerUid: uid }, { "members.uid": uid }],
    });
    if (!world) { res.status(404).json({ error: "world not found" }); return; }

    const favs = await Favorites.find({ uid, worldId: worldObjectId }).toArray();

    const pageIds = favs.map((f) => f.pageId);
    const pages = pageIds.length
      ? await Pages.find({ _id: { $in: pageIds } }).toArray()
      : [];

    const pagesById = new Map<string, string>();
    for (const p of pages) pagesById.set(p._id.toString(), p.title);

    res.status(200).json(
      favs.map((f) => ({
        pageId: f.pageId.toString(),
        worldId: f.worldId.toString(),
        title: pagesById.get(f.pageId.toString()) ?? "",
        createdAt: f.createdAt,
      }))
    );
  });
}
