import type { FastifyPluginAsync } from "fastify";
import { getCollections, ObjectId } from "../db";

export const activityRoutes: FastifyPluginAsync = async (app) => {
  const { Worlds, WorldActivity } = getCollections();

  // GET /worlds/:worldId/activity
  app.get<{
    Params: { worldId: string };
  }>("/worlds/:worldId/activity", async (req, reply) => {
    const uid = req.user!.uid;
    const { worldId } = req.params;

    let worldObjectId: ObjectId;
    try {
      worldObjectId = new ObjectId(worldId);
    } catch {
      return reply.code(400).send({ error: "invalid worldId" });
    }

    // Confirm user has access to this world
    const world = await Worlds.findOne({
      _id: worldObjectId,
      $or: [{ ownerUid: uid }, { "members.uid": uid }],
    });
    if (!world) {
      return reply.code(404).send({ error: "world not found" });
    }

    // Fetch recent activity
    const events = await WorldActivity.find({ worldId: worldObjectId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return events.map((e) => ({
      _id: e._id.toString(),
      worldId: e.worldId.toString(),
      pageId: e.pageId ? e.pageId.toString() : null,
      actorUid: e.actorUid,
      type: e.type,
      meta: e.meta,
      createdAt: e.createdAt,
    }));
  });
};
