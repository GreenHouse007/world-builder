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
  await withAuth(req, res, ["GET", "PUT"], async (user, { Worlds, Pages, PageContent, WorldActivity }) => {
    const pageId = req.query.pageId as string;
    const uid = user.uid;

    const ctx = await ensurePageAccess(pageId, uid, Pages, Worlds);
    if (!ctx) { res.status(404).json({ error: "page not found" }); return; }
    const { page, world } = ctx;

    if (req.method === "GET") {
      const content = await PageContent.findOne({ pageId: page._id, ownerUid: page.ownerUid });
      res.status(200).json({ doc: content?.doc ?? null, updatedAt: content?.updatedAt ?? null });
      return;
    }

    // PUT
    const { doc } = req.body as { doc: unknown };
    if (doc === undefined) { res.status(400).json({ error: "doc is required" }); return; }

    const now = new Date();

    const oldContent = await PageContent.findOne({ pageId: page._id });
    const oldWordCount = oldContent?.doc && typeof oldContent.doc === "string"
      ? (oldContent.doc as string).replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter((w: string) => w.length > 0).length
      : 0;
    const newWordCount = doc && typeof doc === "string"
      ? (doc as string).replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter((w: string) => w.length > 0).length
      : 0;

    await PageContent.updateOne(
      { pageId: page._id, ownerUid: page.ownerUid },
      {
        $set: {
          ownerUid: page.ownerUid,
          worldId: world._id,
          pageId: page._id,
          doc,
          lastEditedBy: uid,
          updatedAt: now,
        },
      },
      { upsert: true }
    );

    await Pages.updateOne(
      { _id: page._id },
      { $set: { lastEditedBy: uid, lastEditedAt: now, updatedAt: now } }
    );

    await Worlds.updateOne({ _id: world._id }, { $set: { lastActivityAt: now, updatedAt: now } });

    await WorldActivity.insertOne({
      _id: new ObjectId(),
      worldId: world._id,
      pageId: page._id,
      actorUid: uid,
      actorName: user.name || user.email || "User",
      type: "content_updated",
      meta: { wordCountDiff: newWordCount - oldWordCount, oldWordCount, newWordCount },
      createdAt: now,
    });

    res.status(200).json({ ok: true, updatedAt: now.toISOString() });
  });
}
