import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../_lib/respond";
import { ObjectId, type WorldDoc, type WorldMember } from "../../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await withAuth(req, res, ["POST"], async (user, { Worlds, Pages, PageContent, WorldActivity }) => {
    const worldId = req.query.worldId as string;
    const uid = user.uid;

    let worldObjectId: ObjectId;
    try {
      worldObjectId = new ObjectId(worldId);
    } catch {
      res.status(400).json({ error: "invalid worldId" }); return;
    }

    const sourceWorld = await Worlds.findOne({ _id: worldObjectId });
    if (!sourceWorld) { res.status(404).json({ error: "world not found" }); return; }

    const members = sourceWorld.members || [];
    const isMember = members.some((m) => m.uid === uid);
    const isOwner = sourceWorld.ownerUid === uid;
    if (!isMember && !isOwner) { res.status(403).json({ error: "forbidden" }); return; }

    const now = new Date();
    const ownerMember: WorldMember = {
      uid,
      email: user.email,
      displayName: user.name,
      role: "owner",
      addedAt: now,
    };

    const newWorld: WorldDoc = {
      _id: new ObjectId(),
      ownerUid: uid,
      name: `${sourceWorld.name} (Copy)`,
      emoji: sourceWorld.emoji,
      members: [ownerMember],
      stats: { pageCount: 0, favoriteCount: 0, collaboratorCount: 1 },
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
    };

    await Worlds.insertOne(newWorld);

    const sourcePages = await Pages.find({ worldId: worldObjectId })
      .sort({ position: 1 })
      .toArray();

    const pageIdMap = new Map<string, ObjectId>();

    for (const sourcePage of sourcePages) {
      const newPageId = new ObjectId();
      pageIdMap.set(sourcePage._id.toString(), newPageId);

      const newParentId = sourcePage.parentId
        ? pageIdMap.get(sourcePage.parentId.toString()) || null
        : null;

      await Pages.insertOne({
        _id: newPageId,
        ownerUid: uid,
        worldId: newWorld._id,
        title: sourcePage.title,
        emoji: sourcePage.emoji,
        parentId: newParentId,
        position: sourcePage.position,
        createdAt: now,
        updatedAt: now,
        lastEditedBy: uid,
        lastEditedAt: now,
      });

      const sourceContent = await PageContent.findOne({
        pageId: sourcePage._id,
        ownerUid: sourcePage.ownerUid,
      });

      if (sourceContent) {
        await PageContent.insertOne({
          _id: new ObjectId(),
          ownerUid: uid,
          worldId: newWorld._id,
          pageId: newPageId,
          doc: sourceContent.doc,
          lastEditedBy: uid,
          updatedAt: now,
        });
      }
    }

    await Worlds.updateOne(
      { _id: newWorld._id },
      { $set: { "stats.pageCount": sourcePages.length, lastActivityAt: now, updatedAt: now } }
    );

    await WorldActivity.insertOne({
      _id: new ObjectId(),
      worldId: newWorld._id,
      actorUid: uid,
      actorName: user.name || user.email || "User",
      type: "world_created",
      meta: {
        name: newWorld.name,
        duplicatedFrom: sourceWorld._id.toString(),
        pageCount: sourcePages.length,
      },
      createdAt: now,
    });

    res.status(200).json({
      _id: newWorld._id.toString(),
      name: newWorld.name,
      emoji: newWorld.emoji,
      ownerUid: newWorld.ownerUid,
      members: newWorld.members,
      stats: { pageCount: sourcePages.length, favoriteCount: 0, collaboratorCount: 1 },
      createdAt: newWorld.createdAt,
      updatedAt: newWorld.updatedAt,
      lastActivityAt: newWorld.lastActivityAt,
    });
  });
}
