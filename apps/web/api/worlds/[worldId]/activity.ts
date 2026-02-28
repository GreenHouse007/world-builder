import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../_lib/respond";
import { ObjectId } from "../../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await withAuth(req, res, ["GET"], async (user, { Worlds, WorldActivity }) => {
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

    const events = await WorldActivity.find({ worldId: worldObjectId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    res.status(200).json(
      events.map((e) => ({
        _id: e._id.toString(),
        worldId: e.worldId.toString(),
        pageId: e.pageId ? e.pageId.toString() : null,
        actorUid: e.actorUid,
        actorName: e.actorName,
        type: e.type,
        meta: e.meta,
        createdAt: e.createdAt,
      }))
    );
  });
}
