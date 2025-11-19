// apps/api/src/routes/worlds.ts
import type { FastifyPluginAsync } from "fastify";
import {
  getCollections,
  ObjectId,
  type WorldDoc,
  type WorldMember,
} from "../db";

export const worldsRoutes: FastifyPluginAsync = async (app) => {
  const { Worlds, Pages, PageContent, Favorites, WorldActivity } =
    getCollections();

  // GET /worlds - all worlds current user is a member of
  app.get("/worlds", async (req) => {
    const uid = req.user!.uid;

    const worlds = await Worlds.find({
      $or: [
        { ownerUid: uid },
        { "members.uid": uid }, // for shared worlds
      ],
    })
      .sort({ lastActivityAt: -1, createdAt: -1 })
      .toArray();

    return worlds.map((w) => ({
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
    }));
  });

  // POST /worlds - create world
  app.post<{
    Body: { name: string; emoji?: string };
  }>("/worlds", async (req, reply) => {
    const uid = req.user!.uid;
    const { name, emoji } = req.body;

    if (!name || !name.trim()) {
      return reply.code(400).send({ error: "name is required" });
    }

    const now = new Date();
    const email = req.user!.email;
    const member: WorldMember = {
      uid,
      email: email || undefined,
      role: "owner",
      addedAt: now,
    };

    const doc: WorldDoc = {
      _id: new ObjectId(),
      ownerUid: uid,
      name: name.trim(),
      emoji: emoji || "🌍",
      members: [member],
      stats: {
        pageCount: 0,
        favoriteCount: 0,
        collaboratorCount: 1,
      },
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
    };

    await Worlds.insertOne(doc);

    await WorldActivity.insertOne({
      _id: new ObjectId(),
      worldId: doc._id,
      actorUid: uid,
      type: "world_created",
      meta: { name: doc.name },
      createdAt: now,
    });

    return {
      _id: doc._id.toString(),
      name: doc.name,
      emoji: doc.emoji,
      ownerUid: doc.ownerUid,
      members: doc.members,
      stats: doc.stats,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      lastActivityAt: doc.lastActivityAt,
    };
  });

  // PATCH /worlds/:worldId - rename / change emoji
  app.patch<{
    Params: { worldId: string };
    Body: { name?: string; emoji?: string };
  }>("/worlds/:worldId", async (req, reply) => {
    const uid = req.user!.uid;
    const { worldId } = req.params;
    const { name, emoji } = req.body;

    let worldObjectId: ObjectId;
    try {
      worldObjectId = new ObjectId(worldId);
    } catch {
      return reply.code(400).send({ error: "invalid worldId" });
    }

    const world = await Worlds.findOne({ _id: worldObjectId });
    if (!world) return reply.code(404).send({ error: "world not found" });

    // basic permission: only owner/admin can edit
    const member = world.members.find((m) => m.uid === uid);
    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      return reply.code(403).send({ error: "forbidden" });
    }

    const update: Partial<WorldDoc> = { updatedAt: new Date() };
    const meta: Record<string, unknown> = {};

    if (name && name.trim() && name.trim() !== world.name) {
      update.name = name.trim();
      meta.name = { from: world.name, to: update.name };
    }
    if (emoji && emoji !== world.emoji) {
      update.emoji = emoji;
      meta.emoji = { from: world.emoji, to: update.emoji };
    }

    if (!Object.keys(meta).length) {
      return { ok: true };
    }

    await Worlds.updateOne({ _id: worldObjectId }, { $set: update });

    await WorldActivity.insertOne({
      _id: new ObjectId(),
      worldId: worldObjectId,
      actorUid: uid,
      type: "world_updated",
      meta,
      createdAt: new Date(),
    });

    return { ok: true };
  });

  // POST /worlds/:worldId/duplicate - duplicate world with all pages
  app.post<{
    Params: { worldId: string };
  }>("/worlds/:worldId/duplicate", async (req, reply) => {
    const uid = req.user!.uid;
    const { worldId } = req.params;

    let worldObjectId: ObjectId;
    try {
      worldObjectId = new ObjectId(worldId);
    } catch {
      return reply.code(400).send({ error: "invalid worldId" });
    }

    const sourceWorld = await Worlds.findOne({ _id: worldObjectId });
    if (!sourceWorld) return reply.code(404).send({ error: "world not found" });

    // Check if user is a member (or owner for backward compatibility)
    const members = sourceWorld.members || [];
    const isMember = members.some((m) => m.uid === uid);
    const isOwner = sourceWorld.ownerUid === uid;

    if (!isMember && !isOwner) {
      return reply.code(403).send({ error: "forbidden" });
    }

    const now = new Date();
    const email = req.user!.email;
    const ownerMember: WorldMember = {
      uid,
      email: email || undefined,
      role: "owner",
      addedAt: now,
    };

    // Create new world
    const newWorld: WorldDoc = {
      _id: new ObjectId(),
      ownerUid: uid,
      name: `${sourceWorld.name} (Copy)`,
      emoji: sourceWorld.emoji,
      members: [ownerMember],
      stats: {
        pageCount: 0,
        favoriteCount: 0,
        collaboratorCount: 1,
      },
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
    };

    await Worlds.insertOne(newWorld);

    // Fetch all pages from source world
    const sourcePages = await Pages.find({ worldId: worldObjectId })
      .sort({ position: 1 })
      .toArray();

    // Map old page IDs to new page IDs to maintain parent-child relationships
    const pageIdMap = new Map<string, ObjectId>();

    // Duplicate pages
    for (const sourcePage of sourcePages) {
      const newPageId = new ObjectId();
      pageIdMap.set(sourcePage._id.toString(), newPageId);

      // Map parent ID if it exists
      const newParentId = sourcePage.parentId
        ? pageIdMap.get(sourcePage.parentId.toString()) || null
        : null;

      const newPage: any = {
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
      };

      await Pages.insertOne(newPage);

      // Copy page content if it exists
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

    // Update world stats
    await Worlds.updateOne(
      { _id: newWorld._id },
      {
        $set: {
          "stats.pageCount": sourcePages.length,
          lastActivityAt: now,
          updatedAt: now,
        },
      }
    );

    // Log activity
    await WorldActivity.insertOne({
      _id: new ObjectId(),
      worldId: newWorld._id,
      actorUid: uid,
      type: "world_created",
      meta: {
        name: newWorld.name,
        duplicatedFrom: sourceWorld._id.toString(),
        pageCount: sourcePages.length,
      },
      createdAt: now,
    });

    return {
      _id: newWorld._id.toString(),
      name: newWorld.name,
      emoji: newWorld.emoji,
      ownerUid: newWorld.ownerUid,
      members: newWorld.members,
      stats: {
        pageCount: sourcePages.length,
        favoriteCount: 0,
        collaboratorCount: 1,
      },
      createdAt: newWorld.createdAt,
      updatedAt: newWorld.updatedAt,
      lastActivityAt: newWorld.lastActivityAt,
    };
  });

  // DELETE /worlds/:worldId - cascades pages, content, favorites, activity
  app.delete<{
    Params: { worldId: string };
  }>("/worlds/:worldId", async (req, reply) => {
    const uid = req.user!.uid;
    const { worldId } = req.params;

    let worldObjectId: ObjectId;
    try {
      worldObjectId = new ObjectId(worldId);
    } catch {
      return reply.code(400).send({ error: "invalid worldId" });
    }

    const world = await Worlds.findOne({ _id: worldObjectId });
    if (!world) return reply.code(404).send({ error: "world not found" });
    if (world.ownerUid !== uid) {
      return reply.code(403).send({ error: "only owner can delete world" });
    }

    const pages = await Pages.find({ worldId: worldObjectId }).toArray();
    const pageIds = pages.map((p) => p._id);

    await Pages.deleteMany({ worldId: worldObjectId });
    await PageContent.deleteMany({ worldId: worldObjectId });
    await Favorites.deleteMany({ worldId: worldObjectId });
    await WorldActivity.deleteMany({ worldId: worldObjectId });
    await Worlds.deleteOne({ _id: worldObjectId });

    await WorldActivity.insertOne({
      _id: new ObjectId(),
      worldId: worldObjectId,
      actorUid: uid,
      type: "world_deleted",
      meta: { pageCount: pageIds.length },
      createdAt: new Date(),
    });

    return { ok: true };
  });
};
