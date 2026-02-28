import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../_lib/respond.js";
import { ObjectId, type WorldDoc, type WorldMember } from "../_lib/db.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawParams = req.query.params;
  const params = Array.isArray(rawParams) ? rawParams : rawParams ? [rawParams] : [];
  const [worldId, sub, thirdPart] = params;

  if (!worldId) {
    res.status(404).json({ error: "not found" });
    return;
  }

  let worldObjectId: ObjectId;
  try {
    worldObjectId = new ObjectId(worldId);
  } catch {
    res.status(400).json({ error: "invalid worldId" });
    return;
  }

  // PATCH/DELETE /api/worlds/:worldId
  if (!sub) {
    await withAuth(req, res, ["PATCH", "DELETE"], async (user, { Worlds, Pages, PageContent, Favorites, WorldActivity }) => {
      const uid = user.uid;

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
    return;
  }

  // POST /api/worlds/:worldId/duplicate
  if (sub === "duplicate") {
    await withAuth(req, res, ["POST"], async (user, { Worlds, Pages, PageContent, WorldActivity }) => {
      const uid = user.uid;

      const sourceWorld = await Worlds.findOne({ _id: worldObjectId });
      if (!sourceWorld) { res.status(404).json({ error: "world not found" }); return; }

      const members = sourceWorld.members || [];
      const isMember = members.some((m) => m.uid === uid);
      const isOwner = sourceWorld.ownerUid === uid;
      if (!isMember && !isOwner) { res.status(403).json({ error: "forbidden" }); return; }

      const now = new Date();
      const ownerMember: WorldMember = {
        uid,
        email: user.email,
        displayName: user.name,
        role: "owner",
        addedAt: now,
      };

      const newWorld: WorldDoc = {
        _id: new ObjectId(),
        ownerUid: uid,
        name: `${sourceWorld.name} (Copy)`,
        emoji: sourceWorld.emoji,
        members: [ownerMember],
        stats: { pageCount: 0, favoriteCount: 0, collaboratorCount: 1 },
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now,
      };

      await Worlds.insertOne(newWorld);

      const sourcePages = await Pages.find({ worldId: worldObjectId }).sort({ position: 1 }).toArray();
      const pageIdMap = new Map<string, ObjectId>();

      for (const sourcePage of sourcePages) {
        const newPageId = new ObjectId();
        pageIdMap.set(sourcePage._id.toString(), newPageId);

        const newParentId = sourcePage.parentId
          ? pageIdMap.get(sourcePage.parentId.toString()) || null
          : null;

        await Pages.insertOne({
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
        });

        const sourceContent = await PageContent.findOne({ pageId: sourcePage._id, ownerUid: sourcePage.ownerUid });
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

      await Worlds.updateOne(
        { _id: newWorld._id },
        { $set: { "stats.pageCount": sourcePages.length, lastActivityAt: now, updatedAt: now } }
      );

      await WorldActivity.insertOne({
        _id: new ObjectId(),
        worldId: newWorld._id,
        actorUid: uid,
        actorName: user.name || user.email || "User",
        type: "world_created",
        meta: { name: newWorld.name, duplicatedFrom: sourceWorld._id.toString(), pageCount: sourcePages.length },
        createdAt: now,
      });

      res.status(200).json({
        _id: newWorld._id.toString(),
        name: newWorld.name,
        emoji: newWorld.emoji,
        ownerUid: newWorld.ownerUid,
        members: newWorld.members,
        stats: { pageCount: sourcePages.length, favoriteCount: 0, collaboratorCount: 1 },
        createdAt: newWorld.createdAt,
        updatedAt: newWorld.updatedAt,
        lastActivityAt: newWorld.lastActivityAt,
      });
    });
    return;
  }

  // GET /api/worlds/:worldId/pages
  if (sub === "pages") {
    await withAuth(req, res, ["GET"], async (user, { Worlds, Pages }) => {
      const uid = user.uid;
      const world = await Worlds.findOne({ _id: worldObjectId, $or: [{ ownerUid: uid }, { "members.uid": uid }] });
      if (!world) { res.status(404).json({ error: "world not found" }); return; }

      const pages = await Pages.find({ worldId: world._id }).sort({ position: 1, createdAt: 1 }).toArray();
      res.status(200).json(pages.map((p) => ({
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
      })));
    });
    return;
  }

  // GET /api/worlds/:worldId/favorites
  if (sub === "favorites") {
    await withAuth(req, res, ["GET"], async (user, { Worlds, Pages, Favorites }) => {
      const uid = user.uid;
      const world = await Worlds.findOne({ _id: worldObjectId, $or: [{ ownerUid: uid }, { "members.uid": uid }] });
      if (!world) { res.status(404).json({ error: "world not found" }); return; }

      const favs = await Favorites.find({ uid, worldId: worldObjectId }).toArray();
      const pageIds = favs.map((f) => f.pageId);
      const pages = pageIds.length ? await Pages.find({ _id: { $in: pageIds } }).toArray() : [];
      const pagesById = new Map<string, string>();
      for (const p of pages) pagesById.set(p._id.toString(), p.title);

      res.status(200).json(favs.map((f) => ({
        pageId: f.pageId.toString(),
        worldId: f.worldId.toString(),
        title: pagesById.get(f.pageId.toString()) ?? "",
        createdAt: f.createdAt,
      })));
    });
    return;
  }

  // GET /api/worlds/:worldId/activity
  if (sub === "activity") {
    await withAuth(req, res, ["GET"], async (user, { Worlds, WorldActivity }) => {
      const uid = user.uid;
      const world = await Worlds.findOne({ _id: worldObjectId, $or: [{ ownerUid: uid }, { "members.uid": uid }] });
      if (!world) { res.status(404).json({ error: "world not found" }); return; }

      const events = await WorldActivity.find({ worldId: worldObjectId }).sort({ createdAt: -1 }).limit(50).toArray();
      res.status(200).json(events.map((e) => ({
        _id: e._id.toString(),
        worldId: e.worldId.toString(),
        pageId: e.pageId ? e.pageId.toString() : null,
        actorUid: e.actorUid,
        actorName: e.actorName,
        type: e.type,
        meta: e.meta,
        createdAt: e.createdAt,
      })));
    });
    return;
  }

  // GET/POST /api/worlds/:worldId/invitations
  if (sub === "invitations") {
    await withAuth(req, res, ["GET", "POST"], async (user, { Worlds, WorldInvitations, WorldActivity }) => {
      const uid = user.uid;

      if (req.method === "GET") {
        const world = await Worlds.findOne({ _id: worldObjectId });
        if (!world) { res.status(404).json({ error: "world not found" }); return; }

        const isOwner = world.ownerUid === uid;
        const userMember = (world.members || []).find((m) => m.uid === uid);
        if (!isOwner && !userMember) { res.status(403).json({ error: "forbidden" }); return; }

        const invites = await WorldInvitations.find({ worldId: worldObjectId, status: "pending" }).toArray();
        res.status(200).json(invites.map((inv) => ({
          _id: inv._id.toString(),
          worldId: inv.worldId.toString(),
          worldName: inv.worldName,
          inviterEmail: inv.inviterEmail,
          inviteeEmail: inv.inviteeEmail,
          role: inv.role,
          createdAt: inv.createdAt,
        })));
        return;
      }

      // POST
      const { email: inviteeEmail, role } = req.body as { email: string; role: "admin" | "editor" };
      if (!inviteeEmail || !role) { res.status(400).json({ error: "email and role are required" }); return; }
      if (!["admin", "editor"].includes(role)) { res.status(400).json({ error: "role must be admin or editor" }); return; }

      const world = await Worlds.findOne({ _id: worldObjectId });
      if (!world) { res.status(404).json({ error: "world not found" }); return; }
      if (!world.members || !Array.isArray(world.members)) world.members = [];

      const isOwner = world.ownerUid === uid;
      const userMember = world.members.find((m) => m.uid === uid);
      if (!isOwner && (!userMember || !["owner", "admin"].includes(userMember.role))) {
        res.status(403).json({ error: "only owners and admins can invite" }); return;
      }

      const existingMember = world.members.find((m) => m.uid === inviteeEmail || m.uid.includes(inviteeEmail));
      if (existingMember) { res.status(400).json({ error: "user already has access" }); return; }

      const existingInvite = await WorldInvitations.findOne({ worldId: worldObjectId, inviteeEmail, status: "pending" });
      if (existingInvite) { res.status(400).json({ error: "invitation already sent to this email" }); return; }

      const now = new Date();
      const invite = {
        _id: new ObjectId(),
        worldId: worldObjectId,
        worldName: world.name,
        inviterUid: uid,
        inviterEmail: user.email || "Unknown",
        inviteeEmail,
        role,
        status: "pending" as const,
        createdAt: now,
      };

      await WorldInvitations.insertOne(invite);
      await WorldActivity.insertOne({
        _id: new ObjectId(),
        worldId: worldObjectId,
        actorUid: uid,
        actorName: user.name || user.email || "User",
        type: "member_invited",
        meta: { email: inviteeEmail, role },
        createdAt: now,
      });

      res.status(200).json({ ok: true, inviteId: invite._id.toString() });
    });
    return;
  }

  // GET /api/worlds/:worldId/members  or  DELETE/PATCH /api/worlds/:worldId/members/:userId
  if (sub === "members") {
    if (!thirdPart) {
      await withAuth(req, res, ["GET"], async (user, { Worlds }) => {
        const uid = user.uid;
        const world = await Worlds.findOne({ _id: worldObjectId });
        if (!world) { res.status(404).json({ error: "world not found" }); return; }
        if (!world.members || !Array.isArray(world.members)) world.members = [];

        const isOwner = world.ownerUid === uid;
        const userMember = world.members.find((m) => m.uid === uid);
        if (!isOwner && !userMember) { res.status(403).json({ error: "access denied" }); return; }

        res.status(200).json(world.members.map((m) => ({
          uid: m.uid,
          email: m.email,
          displayName: m.displayName,
          role: m.role,
          addedAt: m.addedAt,
        })));
      });
    } else {
      const userId = thirdPart;
      await withAuth(req, res, ["DELETE", "PATCH"], async (user, { Worlds, WorldActivity }) => {
        const uid = user.uid;
        const world = await Worlds.findOne({ _id: worldObjectId });
        if (!world) { res.status(404).json({ error: "world not found" }); return; }
        if (!world.members || !Array.isArray(world.members)) world.members = [];

        const isOwner = world.ownerUid === uid;
        const userMember = world.members.find((m) => m.uid === uid);

        if (req.method === "DELETE") {
          if (!isOwner && (!userMember || !["owner", "admin"].includes(userMember.role))) {
            res.status(403).json({ error: "only owners and admins can remove members" }); return;
          }

          const targetMember = world.members.find((m) => m.uid === userId);
          if (targetMember?.role === "owner") { res.status(400).json({ error: "cannot remove owner" }); return; }

          const now = new Date();
          await Worlds.updateOne(
            { _id: worldObjectId },
            { $pull: { members: { uid: userId } }, $inc: { "stats.collaboratorCount": -1 }, $set: { updatedAt: now } }
          );

          await WorldActivity.insertOne({
            _id: new ObjectId(),
            worldId: worldObjectId,
            actorUid: uid,
            actorName: user.name || user.email || "User",
            type: "member_removed",
            meta: { removedUid: userId },
            createdAt: now,
          });

          res.status(200).json({ ok: true });
          return;
        }

        // PATCH — update role
        const { role } = req.body as { role: "admin" | "editor" };
        if (!["admin", "editor"].includes(role)) { res.status(400).json({ error: "role must be admin or editor" }); return; }

        if (!isOwner && (!userMember || !["owner", "admin"].includes(userMember.role))) {
          res.status(403).json({ error: "only owners and admins can update roles" }); return;
        }

        const targetMember = world.members.find((m) => m.uid === userId);
        if (targetMember?.role === "owner") { res.status(400).json({ error: "cannot change owner role" }); return; }

        const now = new Date();
        await Worlds.updateOne(
          { _id: worldObjectId, "members.uid": userId },
          { $set: { "members.$.role": role, updatedAt: now } }
        );

        await WorldActivity.insertOne({
          _id: new ObjectId(),
          worldId: worldObjectId,
          actorUid: uid,
          actorName: user.name || user.email || "User",
          type: "member_role_updated",
          meta: { targetUid: userId, newRole: role },
          createdAt: now,
        });

        res.status(200).json({ ok: true });
      });
    }
    return;
  }

  res.status(404).json({ error: "not found" });
}
