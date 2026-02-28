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
  await withAuth(req, res, ["POST"], async (user, { Worlds, Pages, PageContent, WorldActivity }) => {
    const pageId = req.query.pageId as string;
    const uid = user.uid;

    const ctx = await ensurePageAccess(pageId, uid, Pages, Worlds);
    if (!ctx) { res.status(404).json({ error: "page not found" }); return; }
    const { page, world } = ctx;

    const now = new Date();
    const last = await Pages.find({ worldId: world._id, parentId: page.parentId ?? null })
      .sort({ position: -1 })
      .limit(1)
      .next();

    const newPage: PageDoc = {
      _id: new ObjectId(),
      ownerUid: page.ownerUid,
      worldId: world._id,
      title: `${page.title} (copy)`,
      emoji: page.emoji,
      parentId: page.parentId ?? null,
      position: (last?.position ?? 0) + 1,
      createdAt: now,
      updatedAt: now,
      lastEditedBy: uid,
      lastEditedAt: now,
    };

    await Pages.insertOne(newPage);

    const content = await PageContent.findOne({ pageId: page._id, ownerUid: page.ownerUid });
    if (content) {
      await PageContent.insertOne({
        _id: new ObjectId(),
        ownerUid: content.ownerUid,
        worldId: world._id,
        pageId: newPage._id,
        doc: content.doc,
        lastEditedBy: uid,
        updatedAt: now,
      });
    }

    await Worlds.updateOne(
      { _id: world._id },
      { $inc: { "stats.pageCount": 1 }, $set: { lastActivityAt: now, updatedAt: now } }
    );

    await WorldActivity.insertOne({
      _id: new ObjectId(),
      worldId: world._id,
      pageId: newPage._id,
      actorUid: uid,
      actorName: user.name || user.email || "User",
      type: "page_duplicated",
      meta: { sourcePageId: page._id.toString() },
      createdAt: now,
    });

    res.status(200).json({
      _id: newPage._id.toString(),
      worldId: newPage.worldId.toString(),
      parentId: newPage.parentId ? newPage.parentId.toString() : null,
      title: newPage.title,
      emoji: newPage.emoji,
      position: newPage.position,
      createdAt: newPage.createdAt,
      updatedAt: newPage.updatedAt,
      lastEditedBy: newPage.lastEditedBy,
      lastEditedAt: newPage.lastEditedAt,
    });
  });
}
