import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../../_lib/respond";
import { ObjectId } from "../../../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await withAuth(req, res, ["DELETE", "PATCH"], async (user, { Worlds, WorldActivity }) => {
    const worldId = req.query.worldId as string;
    const userId = req.query.userId as string;
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

    if (req.method === "DELETE") {
      if (!isOwner && (!userMember || !["owner", "admin"].includes(userMember.role))) {
        res.status(403).json({ error: "only owners and admins can remove members" }); return;
      }

      const targetMember = world.members.find((m) => m.uid === userId);
      if (targetMember?.role === "owner") {
        res.status(400).json({ error: "cannot remove owner" }); return;
      }

      const now = new Date();
      await Worlds.updateOne(
        { _id: worldObjectId },
        {
          $pull: { members: { uid: userId } },
          $inc: { "stats.collaboratorCount": -1 },
          $set: { updatedAt: now },
        }
      );

      await WorldActivity.insertOne({
        _id: new ObjectId(),
        worldId: worldObjectId,
        actorUid: uid,
        actorName: user.name || user.email || "User",
        type: "member_removed",
        meta: { removedUid: userId },
        createdAt: now,
      });

      res.status(200).json({ ok: true });
      return;
    }

    // PATCH — update role
    const { role } = req.body as { role: "admin" | "editor" };
    if (!["admin", "editor"].includes(role)) {
      res.status(400).json({ error: "role must be admin or editor" }); return;
    }

    if (!isOwner && (!userMember || !["owner", "admin"].includes(userMember.role))) {
      res.status(403).json({ error: "only owners and admins can update roles" }); return;
    }

    const targetMember = world.members.find((m) => m.uid === userId);
    if (targetMember?.role === "owner") {
      res.status(400).json({ error: "cannot change owner role" }); return;
    }

    const now = new Date();
    await Worlds.updateOne(
      { _id: worldObjectId, "members.uid": userId },
      { $set: { "members.$.role": role, updatedAt: now } }
    );

    await WorldActivity.insertOne({
      _id: new ObjectId(),
      worldId: worldObjectId,
      actorUid: uid,
      actorName: user.name || user.email || "User",
      type: "member_role_updated",
      meta: { targetUid: userId, newRole: role },
      createdAt: now,
    });

    res.status(200).json({ ok: true });
  });
}
