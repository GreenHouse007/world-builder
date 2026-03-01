import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth, parseObjectId } from "../_lib/respond.js";
import { ObjectId, logActivity, type PageDoc } from "../_lib/db.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await withAuth(req, res, ["POST"], async (user, { Worlds, Pages }) => {
    const { worldId, title, emoji, parentId } = req.body as {
      worldId: string;
      title?: string;
      emoji?: string;
      parentId?: string | null;
    };
    const uid = user.uid;

    const worldObjectId = parseObjectId(worldId);
    if (!worldObjectId) { res.status(400).json({ error: "invalid worldId" }); return; }

    const world = await Worlds.findOne({
      _id: worldObjectId,
      $or: [{ ownerUid: uid }, { "members.uid": uid }],
    });
    if (!world) { res.status(404).json({ error: "world not found" }); return; }

    let parentObjectId: ObjectId | null = null;
    if (parentId && parentId !== "null") {
      parentObjectId = parseObjectId(parentId);
      if (!parentObjectId) { res.status(400).json({ error: "invalid parentId" }); return; }
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

    await logActivity(world._id, uid, user, "page_created", { title: safeTitle, parentId: parentObjectId?.toString() ?? null }, page._id);

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
