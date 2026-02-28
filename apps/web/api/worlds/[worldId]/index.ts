import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../_lib/respond";
import { ObjectId, type WorldDoc } from "../../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await withAuth(req, res, ["PATCH", "DELETE"], async (user, { Worlds, Pages, PageContent, Favorites, WorldActivity }) => {
    const worldId = req.query.worldId as string;
    const uid = user.uid;

    let worldObjectId: ObjectId;
    try {
      worldObjectId = new ObjectId(worldId);
    } catch {
      res.status(400).json({ error: "invalid worldId" });
      return;
    }

    if (req.method === "PATCH") {
      const { name, emoji } = req.body as { name?: string; emoji?: string };

      const world = await Worlds.findOne({ _id: worldObjectId });
      if (!world) { res.status(404).json({ error: "world not found" }); return; }

      const member = world.members.find((m) => m.uid === uid);
      if (!member || (member.role !== "owner" && member.role !== "admin")) {
        res.status(403).json({ error: "forbidden" }); return;
      }

      const update: Partial<WorldDoc> = { updatedAt: new Date() };
      const meta: Record<string, unknown> = {};

      if (name && name.trim() && name.trim() !== world.name) {
        update.name = name.trim();
        meta.name = { from: world.name, to: update.name };
      }
      if (emoji !== undefined && emoji !== world.emoji) {
        update.emoji = emoji || undefined;
        meta.emoji = { from: world.emoji, to: emoji };
      }

      if (!Object.keys(meta).length) { res.status(200).json({ ok: true }); return; }

      await Worlds.updateOne({ _id: worldObjectId }, { $set: update });
      await WorldActivity.insertOne({
        _id: new ObjectId(),
        worldId: worldObjectId,
        actorUid: uid,
        actorName: user.name || user.email || "User",
        type: "world_updated",
        meta,
        createdAt: new Date(),
      });

      res.status(200).json({ ok: true });
      return;
    }

    // DELETE
    const world = await Worlds.findOne({ _id: worldObjectId });
    if (!world) { res.status(404).json({ error: "world not found" }); return; }
    if (world.ownerUid !== uid) {
      res.status(403).json({ error: "only owner can delete world" }); return;
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
      actorName: user.name || user.email || "User",
      type: "world_deleted",
      meta: { pageCount: pageIds.length },
      createdAt: new Date(),
    });

    res.status(200).json({ ok: true });
  });
}
