import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../../_lib/respond";
import { ObjectId } from "../../../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await withAuth(req, res, ["GET"], async (user, { Worlds }) => {
    const worldId = req.query.worldId as string;
    const uid = user.uid;

    let worldObjectId: ObjectId;
    try {
      worldObjectId = new ObjectId(worldId);
    } catch {
      res.status(400).json({ error: "invalid worldId" }); return;
    }

    const world = await Worlds.findOne({ _id: worldObjectId });
    if (!world) { res.status(404).json({ error: "world not found" }); return; }

    if (!world.members || !Array.isArray(world.members)) world.members = [];

    const isOwner = world.ownerUid === uid;
    const userMember = world.members.find((m) => m.uid === uid);
    if (!isOwner && !userMember) { res.status(403).json({ error: "access denied" }); return; }

    res.status(200).json(
      world.members.map((m) => ({
        uid: m.uid,
        email: m.email,
        displayName: m.displayName,
        role: m.role,
        addedAt: m.addedAt,
      }))
    );
  });
}
