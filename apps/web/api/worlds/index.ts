import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../_lib/respond.js";
import { ObjectId, type WorldDoc, type WorldMember } from "../_lib/db.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await withAuth(req, res, ["GET", "POST"], async (user, { Worlds, WorldActivity }) => {
    if (req.method === "GET") {
      const uid = user.uid;
      const worlds = await Worlds.find({
        $or: [{ ownerUid: uid }, { "members.uid": uid }],
      })
        .sort({ lastActivityAt: -1, createdAt: -1 })
        .toArray();

      res.status(200).json(
        worlds.map((w) => ({
          _id: w._id.toString(),
          name: w.name,
          emoji: w.emoji,
          ownerUid: w.ownerUid,
          members: w.members ?? [],
          stats: {
            pageCount: w.stats?.pageCount ?? 0,
            favoriteCount: w.stats?.favoriteCount ?? 0,
            collaboratorCount: w.stats?.collaboratorCount ?? w.members?.length ?? 1,
          },
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
          lastActivityAt: w.lastActivityAt ?? w.createdAt,
        }))
      );
      return;
    }

    // POST
    const { name, emoji } = req.body as { name: string; emoji?: string };
    if (!name || !name.trim()) {
      res.status(400).json({ error: "name is required" });
      return;
    }

    const uid = user.uid;
    const now = new Date();
    const member: WorldMember = {
      uid,
      email: user.email,
      displayName: user.name,
      role: "owner",
      addedAt: now,
    };

    const doc: WorldDoc = {
      _id: new ObjectId(),
      ownerUid: uid,
      name: name.trim(),
      emoji: emoji || undefined,
      members: [member],
      stats: { pageCount: 0, favoriteCount: 0, collaboratorCount: 1 },
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
    };

    await Worlds.insertOne(doc);

    await WorldActivity.insertOne({
      _id: new ObjectId(),
      worldId: doc._id,
      actorUid: uid,
      actorName: user.name || user.email || "User",
      type: "world_created",
      meta: { name: doc.name },
      createdAt: now,
    });

    res.status(200).json({
      _id: doc._id.toString(),
      name: doc.name,
      emoji: doc.emoji,
      ownerUid: doc.ownerUid,
      members: doc.members,
      stats: doc.stats,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      lastActivityAt: doc.lastActivityAt,
    });
  });
}
