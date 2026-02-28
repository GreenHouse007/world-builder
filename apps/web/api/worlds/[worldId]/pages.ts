import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../_lib/respond";
import { ObjectId } from "../../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await withAuth(req, res, ["GET"], async (user, { Worlds, Pages }) => {
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

    const pages = await Pages.find({ worldId: world._id })
      .sort({ position: 1, createdAt: 1 })
      .toArray();

    res.status(200).json(
      pages.map((p) => ({
        _id: p._id.toString(),
        worldId: p.worldId.toString(),
        parentId: p.parentId ? p.parentId.toString() : null,
        title: p.title,
        emoji: p.emoji,
        position: p.position,
        lastEditedBy: p.lastEditedBy,
        lastEditedAt: p.lastEditedAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }))
    );
  });
}
