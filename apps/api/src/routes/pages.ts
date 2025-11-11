import type { FastifyPluginAsync } from "fastify";
import { getCollections, ObjectId, type PageDoc, type WorldDoc } from "../db";

export const pagesRoutes: FastifyPluginAsync = async (app) => {
  const { Worlds, Pages, PageContent, Favorites, WorldActivity } =
    getCollections();

  // --- Helpers ---

  async function getWorldForUser(
    worldId: string,
    uid: string
  ): Promise<WorldDoc | null> {
    let worldObjectId: ObjectId;
    try {
      worldObjectId = new ObjectId(worldId);
    } catch {
      return null;
    }

    const world = await Worlds.findOne({
      _id: worldObjectId,
      $or: [{ ownerUid: uid }, { "members.uid": uid }],
    });

    return world ?? null;
  }

  async function ensurePageAccess(
    pageId: string,
    uid: string
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

  // --- Routes ---

  // GET /worlds/:worldId/pages
  app.get<{
    Params: { worldId: string };
  }>("/worlds/:worldId/pages", async (req, reply) => {
    const uid = req.user!.uid;
    const { worldId } = req.params;

    const world = await getWorldForUser(worldId, uid);
    if (!world) {
      return reply.code(404).send({ error: "world not found" });
    }

    const pages = await Pages.find({
      worldId: world._id,
    })
      .sort({ position: 1, createdAt: 1 })
      .toArray();

    return pages.map((p) => ({
      _id: p._id.toString(),
      worldId: p.worldId.toString(),
      parentId: p.parentId ? p.parentId.toString() : null,
      title: p.title,
      emoji: p.emoji,
      position: p.position,
      lastEditedBy: p.lastEditedBy,
      lastEditedAt: p.lastEditedAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  });

  // POST /pages - create page
  app.post<{
    Body: {
      worldId: string;
      title?: string;
      emoji?: string;
      parentId?: string | null;
    };
  }>("/pages", async (req, reply) => {
    const uid = req.user!.uid;
    const { worldId, title, emoji, parentId } = req.body;

    const world = await getWorldForUser(worldId, uid);
    if (!world) {
      return reply.code(404).send({ error: "world not found" });
    }

    let parentObjectId: ObjectId | null = null;
    if (parentId && parentId !== "null") {
      try {
        parentObjectId = new ObjectId(parentId);
      } catch {
        return reply.code(400).send({ error: "invalid parentId" });
      }
      const parent = await Pages.findOne({
        _id: parentObjectId,
        worldId: world._id,
      });
      if (!parent) {
        return reply
          .code(400)
          .send({ error: "parent page not found in this world" });
      }
    }

    const last = await Pages.find({
      worldId: world._id,
      parentId: parentObjectId,
    })
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
      {
        $set: {
          "stats.pageCount": (world.stats?.pageCount ?? 0) + 1,
          lastActivityAt: now,
          updatedAt: now,
        },
        $inc: { "stats.pageCount": 1 },
      }
    );

    await WorldActivity.insertOne({
      _id: new ObjectId(),
      worldId: world._id,
      pageId: page._id,
      actorUid: uid,
      type: "page_created",
      meta: { title: safeTitle, parentId: parentObjectId?.toString() ?? null },
      createdAt: now,
    });

    return {
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
    };
  });

  // PATCH /pages/:pageId - rename
  app.patch<{
    Params: { pageId: string };
    Body: { title?: string };
  }>("/pages/:pageId", async (req, reply) => {
    const uid = req.user!.uid;
    const { pageId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return reply.code(400).send({ error: "title is required" });
    }

    const ctx = await ensurePageAccess(pageId, uid);
    if (!ctx) return reply.code(404).send({ error: "page not found" });
    const { page, world } = ctx;

    const now = new Date();
    const nextTitle = title.trim();

    await Pages.updateOne(
      { _id: page._id },
      {
        $set: {
          title: nextTitle,
          updatedAt: now,
          lastEditedBy: uid,
          lastEditedAt: now,
        },
      }
    );

    await Worlds.updateOne(
      { _id: world._id },
      { $set: { lastActivityAt: now, updatedAt: now } }
    );

    await WorldActivity.insertOne({
      _id: new ObjectId(),
      worldId: world._id,
      pageId: page._id,
      actorUid: uid,
      type: "page_renamed",
      meta: { from: page.title, to: nextTitle },
      createdAt: now,
    });

    return { ok: true };
  });

  // PATCH /pages/:pageId/move - change parent
  app.patch<{
    Params: { pageId: string };
    Body: { parentId?: string | null };
  }>("/pages/:pageId/move", async (req, reply) => {
    const uid = req.user!.uid;
    const { pageId } = req.params;
    const { parentId } = req.body;

    const ctx = await ensurePageAccess(pageId, uid);
    if (!ctx) return reply.code(404).send({ error: "page not found" });
    const { page, world } = ctx;

    let parentObjectId: ObjectId | null = null;
    if (parentId) {
      try {
        parentObjectId = new ObjectId(parentId);
      } catch {
        return reply.code(400).send({ error: "invalid parentId" });
      }
      const parent = await Pages.findOne({
        _id: parentObjectId,
        worldId: world._id,
      });
      if (!parent) {
        return reply
          .code(400)
          .send({ error: "parent page not found in this world" });
      }
    }

    // Basic cycle guard: parent cannot be self
    if (parentObjectId && parentObjectId.equals(page._id)) {
      return reply.code(400).send({ error: "page cannot be its own parent" });
    }

    const last = await Pages.find({
      worldId: world._id,
      parentId: parentObjectId,
    })
      .sort({ position: -1 })
      .limit(1)
      .next();

    const now = new Date();
    const newPos = (last?.position ?? 0) + 1;

    await Pages.updateOne(
      { _id: page._id },
      {
        $set: {
          parentId: parentObjectId,
          position: newPos,
          updatedAt: now,
          lastEditedBy: uid,
          lastEditedAt: now,
        },
      }
    );

    await Worlds.updateOne(
      { _id: world._id },
      { $set: { lastActivityAt: now, updatedAt: now } }
    );

    await WorldActivity.insertOne({
      _id: new ObjectId(),
      worldId: world._id,
      pageId: page._id,
      actorUid: uid,
      type: "page_moved",
      meta: {
        newParentId: parentObjectId ? parentObjectId.toString() : null,
      },
      createdAt: now,
    });

    return { ok: true };
  });

  // DELETE /pages/:pageId - delete page + subtree
  app.delete<{
    Params: { pageId: string };
  }>("/pages/:pageId", async (req, reply) => {
    const uid = req.user!.uid;
    const { pageId } = req.params;

    const ctx = await ensurePageAccess(pageId, uid);
    if (!ctx) return reply.code(404).send({ error: "page not found" });
    const { page, world } = ctx;

    // gather subtree
    const toDelete = new Set<string>();
    const stack: ObjectId[] = [page._id];

    while (stack.length) {
      const id = stack.pop() as ObjectId;
      if (toDelete.has(id.toString())) continue;
      toDelete.add(id.toString());
      const children = await Pages.find({
        worldId: world._id,
        parentId: id,
      }).toArray();
      for (const c of children) stack.push(c._id);
    }

    const ids = Array.from(toDelete).map((id) => new ObjectId(id));

    await Pages.deleteMany({ _id: { $in: ids }, worldId: world._id });
    await PageContent.deleteMany({ pageId: { $in: ids } });
    await Favorites.deleteMany({ pageId: { $in: ids } });

    const delta = ids.length;

    const now = new Date();
    await Worlds.updateOne(
      { _id: world._id },
      {
        $inc: { "stats.pageCount": -delta },
        $set: { lastActivityAt: now, updatedAt: now },
      }
    );

    await WorldActivity.insertOne({
      _id: new ObjectId(),
      worldId: world._id,
      pageId: page._id,
      actorUid: uid,
      type: "page_deleted",
      meta: { count: delta, title: page.title },
      createdAt: now,
    });

    return { ok: true };
  });

  // POST /pages/:pageId/duplicate - shallow duplicate
  app.post<{
    Params: { pageId: string };
  }>("/pages/:pageId/duplicate", async (req, reply) => {
    const uid = req.user!.uid;
    const { pageId } = req.params;

    const ctx = await ensurePageAccess(pageId, uid);
    if (!ctx) return reply.code(404).send({ error: "page not found" });
    const { page, world } = ctx;

    const now = new Date();
    const last = await Pages.find({
      worldId: world._id,
      parentId: page.parentId ?? null,
    })
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

    const content = await PageContent.findOne({
      pageId: page._id,
      ownerUid: page.ownerUid,
    });

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
      {
        $inc: { "stats.pageCount": 1 },
        $set: { lastActivityAt: now, updatedAt: now },
      }
    );

    await WorldActivity.insertOne({
      _id: new ObjectId(),
      worldId: world._id,
      pageId: newPage._id,
      actorUid: uid,
      type: "page_duplicated",
      meta: { sourcePageId: page._id.toString() },
      createdAt: now,
    });

    return {
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
    };
  });

  // GET /pages/:pageId/content
  app.get<{
    Params: { pageId: string };
  }>("/pages/:pageId/content", async (req, reply) => {
    const uid = req.user!.uid;
    const { pageId } = req.params;

    const ctx = await ensurePageAccess(pageId, uid);
    if (!ctx) return reply.code(404).send({ error: "page not found" });
    const { page } = ctx;

    const content = await PageContent.findOne({
      pageId: page._id,
      ownerUid: page.ownerUid,
    });

    return {
      doc: content?.doc ?? null,
      updatedAt: content?.updatedAt ?? null,
    };
  });

  // PUT /pages/:pageId/content - autosave
  app.put<{
    Params: { pageId: string };
    Body: { doc: unknown };
  }>("/pages/:pageId/content", async (req, reply) => {
    const uid = req.user!.uid;
    const { pageId } = req.params;
    const { doc } = req.body;

    if (doc === undefined) {
      return reply.code(400).send({ error: "doc is required" });
    }

    const ctx = await ensurePageAccess(pageId, uid);
    if (!ctx) return reply.code(404).send({ error: "page not found" });
    const { page, world } = ctx;

    const now = new Date();

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
      {
        $set: {
          lastEditedBy: uid,
          lastEditedAt: now,
          updatedAt: now,
        },
      }
    );

    await Worlds.updateOne(
      { _id: world._id },
      { $set: { lastActivityAt: now, updatedAt: now } }
    );

    await WorldActivity.insertOne({
      _id: new ObjectId(),
      worldId: world._id,
      pageId: page._id,
      actorUid: uid,
      type: "content_updated",
      meta: {},
      createdAt: now,
    });

    return { ok: true, updatedAt: now.toISOString() };
  });
};
