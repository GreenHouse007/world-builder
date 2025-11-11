import type { FastifyPluginAsync } from "fastify";
import { getCollections, ObjectId } from "../db";

export const favoritesRoutes: FastifyPluginAsync = async (app) => {
  const { Worlds, Pages, Favorites } = getCollections();

  // Helpers
  async function ensureWorldAccess(
    worldId: ObjectId,
    uid: string
  ): Promise<boolean> {
    const world = await Worlds.findOne({
      _id: worldId,
      $or: [{ ownerUid: uid }, { "members.uid": uid }],
    });
    return !!world;
  }

  // GET /worlds/:worldId/favorites - favorites for current user in a world
  app.get<{
    Params: { worldId: string };
  }>("/worlds/:worldId/favorites", async (req, reply) => {
    const uid = req.user!.uid;
    const { worldId } = req.params;

    let worldObjectId: ObjectId;
    try {
      worldObjectId = new ObjectId(worldId);
    } catch {
      return reply.code(400).send({ error: "invalid worldId" });
    }

    const hasAccess = await ensureWorldAccess(worldObjectId, uid);
    if (!hasAccess) {
      return reply.code(404).send({ error: "world not found" });
    }

    const favs = await Favorites.find({
      uid,
      worldId: worldObjectId,
    }).toArray();

    // Optionally join page info for convenience
    const pageIds = favs.map((f) => f.pageId);
    const pages = pageIds.length
      ? await getCollections()
          .Pages.find({
            _id: { $in: pageIds },
          })
          .toArray()
      : [];

    const pagesById = new Map<string, string>();
    for (const p of pages) {
      pagesById.set(p._id.toString(), p.title);
    }

    return favs.map((f) => ({
      pageId: f.pageId.toString(),
      worldId: f.worldId.toString(),
      title: pagesById.get(f.pageId.toString()) ?? "",
      createdAt: f.createdAt,
    }));
  });

  // POST /favorites - add favorite
  app.post<{
    Body: { worldId: string; pageId: string };
  }>("/favorites", async (req, reply) => {
    const uid = req.user!.uid;
    const { worldId, pageId } = req.body;

    let worldObjectId: ObjectId;
    let pageObjectId: ObjectId;

    try {
      worldObjectId = new ObjectId(worldId);
      pageObjectId = new ObjectId(pageId);
    } catch {
      return reply.code(400).send({ error: "invalid ids" });
    }

    const page = await getCollections().Pages.findOne({
      _id: pageObjectId,
      worldId: worldObjectId,
    });
    if (!page) {
      return reply.code(404).send({ error: "page not found in world" });
    }

    const hasAccess = await ensureWorldAccess(worldObjectId, uid);
    if (!hasAccess) {
      return reply.code(403).send({ error: "forbidden" });
    }

    const existing = await Favorites.findOne({
      uid,
      worldId: worldObjectId,
      pageId: pageObjectId,
    });
    if (existing) {
      return { ok: true };
    }

    const now = new Date();

    await Favorites.insertOne({
      _id: new ObjectId(),
      uid,
      worldId: worldObjectId,
      pageId: pageObjectId,
      createdAt: now,
    });

    await Worlds.updateOne(
      { _id: worldObjectId },
      { $inc: { "stats.favoriteCount": 1 }, $set: { updatedAt: now } }
    );

    return { ok: true };
  });

  // DELETE /favorites/:pageId - remove favorite for current user
  app.delete<{
    Params: { pageId: string };
  }>("/favorites/:pageId", async (req, reply) => {
    const uid = req.user!.uid;
    const { pageId } = req.params;

    let pageObjectId: ObjectId;
    try {
      pageObjectId = new ObjectId(pageId);
    } catch {
      return reply.code(400).send({ error: "invalid pageId" });
    }

    const page = await getCollections().Pages.findOne({ _id: pageObjectId });
    if (!page) {
      return reply.code(404).send({ error: "page not found" });
    }

    const worldObjectId = page.worldId;

    const res = await Favorites.deleteOne({
      uid,
      pageId: pageObjectId,
      worldId: worldObjectId,
    });

    if (res.deletedCount) {
      await Worlds.updateOne(
        { _id: worldObjectId },
        { $inc: { "stats.favoriteCount": -1 } }
      );
    }

    return { ok: true };
  });
};
