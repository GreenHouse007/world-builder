import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../_lib/respond";
import { ObjectId, type PageDoc } from "../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await withAuth(req, res, ["POST"], async (user, { Worlds, Pages, WorldActivity }) => {
    const { worldId, title, emoji, parentId } = req.body as {
      worldId: string;
      title?: string;
      emoji?: string;
      parentId?: string | null;
    };
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

    let parentObjectId: ObjectId | null = null;
    if (parentId && parentId !== "null") {
      try {
        parentObjectId = new ObjectId(parentId);
      } catch {
        res.status(400).json({ error: "invalid parentId" }); return;
      }
      const parent = await Pages.findOne({ _id: parentObjectId, worldId: world._id });
      if (!parent) { res.status(400).json({ error: "parent page not found in this world" }); return; }
    }

    const last = await Pages.find({ worldId: world._id, parentId: parentObjectId })
      .sort({ position: -1 })
      .limit(1)
      .next();

    const now = new Date();
    const safeTitle = (title && title.trim()) || "New Page";
    const pos = (last?.position ?? 0) + 1;

    const page: PageDoc = {
      _id: new ObjectId(),
      ownerUid: world.ownerUid,
      worldId: world._id,
      title: safeTitle,
      emoji: emoji || "📄",
      parentId: parentObjectId,
      position: pos,
      createdAt: now,
      updatedAt: now,
      lastEditedBy: uid,
      lastEditedAt: now,
    };

    await Pages.insertOne(page);

    await Worlds.updateOne(
      { _id: world._id },
      { $inc: { "stats.pageCount": 1 }, $set: { lastActivityAt: now, updatedAt: now } }
    );

    await WorldActivity.insertOne({
      _id: new ObjectId(),
      worldId: world._id,
      pageId: page._id,
      actorUid: uid,
      actorName: user.name || user.email || "User",
      type: "page_created",
      meta: { title: safeTitle, parentId: parentObjectId?.toString() ?? null },
      createdAt: now,
    });

    res.status(200).json({
      _id: page._id.toString(),
      worldId: page.worldId.toString(),
      parentId: page.parentId ? page.parentId.toString() : null,
      title: page.title,
      emoji: page.emoji,
      position: page.position,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      lastEditedBy: page.lastEditedBy,
      lastEditedAt: page.lastEditedAt,
    });
  });
}
