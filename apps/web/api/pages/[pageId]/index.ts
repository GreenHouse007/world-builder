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
  await withAuth(req, res, ["PATCH", "DELETE"], async (user, { Worlds, Pages, PageContent, Favorites, WorldActivity }) => {
    const pageId = req.query.pageId as string;
    const uid = user.uid;

    if (req.method === "PATCH") {
      const { title } = req.body as { title?: string };
      if (!title || !title.trim()) { res.status(400).json({ error: "title is required" }); return; }

      const ctx = await ensurePageAccess(pageId, uid, Pages, Worlds);
      if (!ctx) { res.status(404).json({ error: "page not found" }); return; }
      const { page, world } = ctx;

      const now = new Date();
      const nextTitle = title.trim();

      await Pages.updateOne(
        { _id: page._id },
        { $set: { title: nextTitle, updatedAt: now, lastEditedBy: uid, lastEditedAt: now } }
      );
      await Worlds.updateOne({ _id: world._id }, { $set: { lastActivityAt: now, updatedAt: now } });
      await WorldActivity.insertOne({
        _id: new ObjectId(),
        worldId: world._id,
        pageId: page._id,
        actorUid: uid,
        actorName: user.name || user.email || "User",
        type: "page_renamed",
        meta: { from: page.title, to: nextTitle },
        createdAt: now,
      });

      res.status(200).json({ ok: true });
      return;
    }

    // DELETE
    const ctx = await ensurePageAccess(pageId, uid, Pages, Worlds);
    if (!ctx) { res.status(404).json({ error: "page not found" }); return; }
    const { page, world } = ctx;

    const toDelete = new Set<string>();
    const stack: ObjectId[] = [page._id];

    while (stack.length) {
      const id = stack.pop() as ObjectId;
      if (toDelete.has(id.toString())) continue;
      toDelete.add(id.toString());
      const children = await Pages.find({ worldId: world._id, parentId: id }).toArray();
      for (const c of children) stack.push(c._id);
    }

    const ids = Array.from(toDelete).map((id) => new ObjectId(id));
    await Pages.deleteMany({ _id: { $in: ids }, worldId: world._id });
    await PageContent.deleteMany({ pageId: { $in: ids } });
    await Favorites.deleteMany({ pageId: { $in: ids } });

    const now = new Date();
    await Worlds.updateOne(
      { _id: world._id },
      { $inc: { "stats.pageCount": -ids.length }, $set: { lastActivityAt: now, updatedAt: now } }
    );
    await WorldActivity.insertOne({
      _id: new ObjectId(),
      worldId: world._id,
      pageId: page._id,
      actorUid: uid,
      actorName: user.name || user.email || "User",
      type: "page_deleted",
      meta: { count: ids.length, title: page.title },
      createdAt: now,
    });

    res.status(200).json({ ok: true });
  });
}
