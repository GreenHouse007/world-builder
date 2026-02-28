import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../_lib/respond";
import { ObjectId, type PageDoc, type WorldDoc } from "../_lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensurePageAccess(pageId: string, uid: string, Pages: any, Worlds: any): Promise<{ page: PageDoc; world: WorldDoc } | null> {
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
  const rawParams = req.query.params;
  const params = Array.isArray(rawParams) ? rawParams : rawParams ? [rawParams] : [];
  const [pageId, sub] = params;

  if (!pageId) {
    res.status(404).json({ error: "not found" });
    return;
  }

  // PATCH/DELETE /api/pages/:pageId
  if (!sub) {
    await withAuth(req, res, ["PATCH", "DELETE"], async (user, { Worlds, Pages, PageContent, Favorites, WorldActivity }) => {
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
    return;
  }

  // GET/PUT /api/pages/:pageId/content
  if (sub === "content") {
    await withAuth(req, res, ["GET", "PUT"], async (user, { Worlds, Pages, PageContent, WorldActivity }) => {
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
    return;
  }

  // POST /api/pages/:pageId/duplicate
  if (sub === "duplicate") {
    await withAuth(req, res, ["POST"], async (user, { Worlds, Pages, PageContent, WorldActivity }) => {
      const uid = user.uid;
      const ctx = await ensurePageAccess(pageId, uid, Pages, Worlds);
      if (!ctx) { res.status(404).json({ error: "page not found" }); return; }
      const { page, world } = ctx;

      const now = new Date();
      const last = await Pages.find({ worldId: world._id, parentId: page.parentId ?? null })
        .sort({ position: -1 }).limit(1).next();

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
    return;
  }

  // PATCH /api/pages/:pageId/move
  if (sub === "move") {
    await withAuth(req, res, ["PATCH"], async (user, { Worlds, Pages, WorldActivity }) => {
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
          .sort({ position: -1 }).limit(1).next();
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
    return;
  }

  res.status(404).json({ error: "not found" });
}
