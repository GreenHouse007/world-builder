import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../_lib/respond";
import { ObjectId, type PageDoc, type WorldDoc } from "../../_lib/db";

async function ensurePageAccess(
  pageId: string,
  uid: string,
  Pages: any,
  Worlds: any
): Promise<{ page: PageDoc; world: WorldDoc } | null> {
  let pageObjectId: ObjectId;
  try {
    pageObjectId = new ObjectId(pageId);
  } catch {
    return null;
  }

  const page = await Pages.findOne({ _id: pageObjectId });
  if (!page) return null;

  const world = await Worlds.findOne({
    _id: page.worldId,
    $or: [{ ownerUid: uid }, { "members.uid": uid }],
  });
  if (!world) return null;

  return { page, world };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await withAuth(req, res, ["PATCH"], async (user, { Worlds, Pages, WorldActivity }) => {
    const pageId = req.query.pageId as string;
    const uid = user.uid;
    const { parentId, position } = req.body as { parentId?: string | null; position?: number };

    const ctx = await ensurePageAccess(pageId, uid, Pages, Worlds);
    if (!ctx) { res.status(404).json({ error: "page not found" }); return; }
    const { page, world } = ctx;

    let parentObjectId: ObjectId | null = null;
    if (parentId) {
      try {
        parentObjectId = new ObjectId(parentId);
      } catch {
        res.status(400).json({ error: "invalid parentId" }); return;
      }
      const parent = await Pages.findOne({ _id: parentObjectId, worldId: world._id });
      if (!parent) { res.status(400).json({ error: "parent page not found in this world" }); return; }
    }

    if (parentObjectId && parentObjectId.equals(page._id)) {
      res.status(400).json({ error: "page cannot be its own parent" }); return;
    }

    const now = new Date();
    let newPos: number;

    const oldParentId = page.parentId;
    const oldPosition = page.position;
    const movingWithinSameParent = oldParentId && parentObjectId && oldParentId.equals(parentObjectId);

    if (position !== undefined && position >= 0) {
      newPos = position;

      if (movingWithinSameParent) {
        if (oldPosition < position) {
          await Pages.updateMany(
            { worldId: world._id, parentId: parentObjectId, position: { $gt: oldPosition, $lte: position }, _id: { $ne: page._id } },
            { $inc: { position: -1 } }
          );
        } else if (oldPosition > position) {
          await Pages.updateMany(
            { worldId: world._id, parentId: parentObjectId, position: { $gte: position, $lt: oldPosition }, _id: { $ne: page._id } },
            { $inc: { position: 1 } }
          );
        }
      } else {
        if (oldParentId) {
          await Pages.updateMany(
            { worldId: world._id, parentId: oldParentId, position: { $gt: oldPosition } },
            { $inc: { position: -1 } }
          );
        }
        await Pages.updateMany(
          { worldId: world._id, parentId: parentObjectId, position: { $gte: position } },
          { $inc: { position: 1 } }
        );
      }
    } else {
      const last = await Pages.find({ worldId: world._id, parentId: parentObjectId })
        .sort({ position: -1 })
        .limit(1)
        .next();
      newPos = (last?.position ?? 0) + 1;
    }

    await Pages.updateOne(
      { _id: page._id },
      { $set: { parentId: parentObjectId, position: newPos, updatedAt: now, lastEditedBy: uid, lastEditedAt: now } }
    );

    await Worlds.updateOne({ _id: world._id }, { $set: { lastActivityAt: now, updatedAt: now } });

    await WorldActivity.insertOne({
      _id: new ObjectId(),
      worldId: world._id,
      pageId: page._id,
      actorUid: uid,
      actorName: user.name || user.email || "User",
      type: "page_moved",
      meta: { newParentId: parentObjectId ? parentObjectId.toString() : null },
      createdAt: now,
    });

    res.status(200).json({ ok: true });
  });
}
