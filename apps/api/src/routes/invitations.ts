import type { FastifyPluginAsync } from "fastify";
import { getCollections, ObjectId } from "../db.js";

interface InviteDoc {
  _id: ObjectId;
  worldId: ObjectId;
  worldName: string;
  inviterUid: string;
  inviterEmail: string;
  inviteeEmail: string;
  role: "admin" | "editor";
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  respondedAt?: Date;
}

export const invitationsRoutes: FastifyPluginAsync = async (app) => {
  const { Worlds, WorldInvitations, WorldActivity } = getCollections();

  // GET /invitations - get pending invites for current user
  app.get("/invitations", async (req) => {
    const uid = req.user!.uid;
    const email = req.user!.email;

    const invites = await WorldInvitations.find({
      inviteeEmail: email,
      status: "pending",
    })
      .sort({ createdAt: -1 })
      .toArray();

    return invites.map((inv) => ({
      _id: inv._id.toString(),
      worldId: inv.worldId.toString(),
      worldName: inv.worldName,
      inviterEmail: inv.inviterEmail,
      role: inv.role,
      createdAt: inv.createdAt,
    }));
  });

  // POST /worlds/:worldId/invitations - send invitation
  app.post<{
    Params: { worldId: string };
    Body: { email: string; role: "admin" | "editor" };
  }>("/worlds/:worldId/invitations", async (req, reply) => {
    const uid = req.user!.uid;
    const email = req.user!.email;
    const { worldId } = req.params;
    const { email: inviteeEmail, role } = req.body;

    if (!inviteeEmail || !role) {
      return reply.code(400).send({ error: "email and role are required" });
    }

    if (!["admin", "editor"].includes(role)) {
      return reply.code(400).send({ error: "role must be admin or editor" });
    }

    let worldObjectId: ObjectId;
    try {
      worldObjectId = new ObjectId(worldId);
    } catch {
      return reply.code(400).send({ error: "invalid worldId" });
    }

    // Check if user has permission (must be owner or admin)
    const world = await Worlds.findOne({ _id: worldObjectId });
    if (!world) {
      return reply.code(404).send({ error: "world not found" });
    }

    // Ensure members array exists
    if (!world.members || !Array.isArray(world.members)) {
      world.members = [];
    }

    // Check if user is owner or in members list
    const isOwner = world.ownerUid === uid;
    const userMember = world.members.find((m) => m.uid === uid);

    if (!isOwner && (!userMember || !["owner", "admin"].includes(userMember.role))) {
      return reply
        .code(403)
        .send({ error: "only owners and admins can invite" });
    }

    // Check if user already a member
    const existingMember = world.members.find(
      (m) => m.uid === inviteeEmail || m.uid.includes(inviteeEmail)
    );
    if (existingMember) {
      return reply.code(400).send({ error: "user already has access" });
    }

    // Check for existing pending invitation
    const existingInvite = await WorldInvitations.findOne({
      worldId: worldObjectId,
      inviteeEmail,
      status: "pending",
    });
    if (existingInvite) {
      return reply
        .code(400)
        .send({ error: "invitation already sent to this email" });
    }

    const now = new Date();
    const invite: InviteDoc = {
      _id: new ObjectId(),
      worldId: worldObjectId,
      worldName: world.name,
      inviterUid: uid,
      inviterEmail: email || "Unknown",
      inviteeEmail,
      role,
      status: "pending",
      createdAt: now,
    };

    await WorldInvitations.insertOne(invite);

    await WorldActivity.insertOne({
      _id: new ObjectId(),
      worldId: worldObjectId,
      actorUid: uid,
      actorName: req.user!.name || req.user!.email || 'User',
      type: "member_invited",
      meta: { email: inviteeEmail, role },
      createdAt: now,
    });

    return { ok: true, inviteId: invite._id.toString() };
  });

  // POST /invitations/:inviteId/accept - accept invitation
  app.post<{
    Params: { inviteId: string };
  }>("/invitations/:inviteId/accept", async (req, reply) => {
    const uid = req.user!.uid;
    const email = req.user!.email;
    const { inviteId } = req.params;

    let inviteObjectId: ObjectId;
    try {
      inviteObjectId = new ObjectId(inviteId);
    } catch {
      return reply.code(400).send({ error: "invalid inviteId" });
    }

    const invite = await WorldInvitations.findOne({ _id: inviteObjectId });
    if (!invite) {
      return reply.code(404).send({ error: "invitation not found" });
    }

    if (invite.inviteeEmail !== email) {
      return reply.code(403).send({ error: "invitation not for you" });
    }

    if (invite.status !== "pending") {
      return reply
        .code(400)
        .send({ error: "invitation already responded to" });
    }

    const now = new Date();

    // Add user to world members
    await Worlds.updateOne(
      { _id: invite.worldId },
      {
        $push: {
          members: {
            uid,
            email: email || undefined,
            displayName: req.user!.name || undefined,
            role: invite.role,
            addedAt: now,
          },
        },
        $inc: { "stats.collaboratorCount": 1 },
        $set: { updatedAt: now },
      }
    );

    // Update invitation status
    await WorldInvitations.updateOne(
      { _id: inviteObjectId },
      { $set: { status: "accepted", respondedAt: now } }
    );

    await WorldActivity.insertOne({
      _id: new ObjectId(),
      worldId: invite.worldId,
      actorUid: uid,
      actorName: req.user!.name || req.user!.email || 'User',
      type: "member_joined",
      meta: { role: invite.role },
      createdAt: now,
    });

    return { ok: true };
  });

  // POST /invitations/:inviteId/reject - reject invitation
  app.post<{
    Params: { inviteId: string };
  }>("/invitations/:inviteId/reject", async (req, reply) => {
    const email = req.user!.email;
    const { inviteId } = req.params;

    let inviteObjectId: ObjectId;
    try {
      inviteObjectId = new ObjectId(inviteId);
    } catch {
      return reply.code(400).send({ error: "invalid inviteId" });
    }

    const invite = await WorldInvitations.findOne({ _id: inviteObjectId });
    if (!invite) {
      return reply.code(404).send({ error: "invitation not found" });
    }

    if (invite.inviteeEmail !== email) {
      return reply.code(403).send({ error: "invitation not for you" });
    }

    if (invite.status !== "pending") {
      return reply
        .code(400)
        .send({ error: "invitation already responded to" });
    }

    await WorldInvitations.updateOne(
      { _id: inviteObjectId },
      { $set: { status: "rejected", respondedAt: new Date() } }
    );

    return { ok: true };
  });

  // GET /worlds/:worldId/members - get members of a world
  app.get<{
    Params: { worldId: string };
  }>("/worlds/:worldId/members", async (req, reply) => {
    const uid = req.user!.uid;
    const { worldId } = req.params;

    let worldObjectId: ObjectId;
    try {
      worldObjectId = new ObjectId(worldId);
    } catch {
      return reply.code(400).send({ error: "invalid worldId" });
    }

    const world = await Worlds.findOne({ _id: worldObjectId });
    if (!world) {
      return reply.code(404).send({ error: "world not found" });
    }

    // Ensure members array exists
    if (!world.members || !Array.isArray(world.members)) {
      world.members = [];
    }

    // Check if user has access (owner or in members list)
    const isOwner = world.ownerUid === uid;
    const userMember = world.members.find((m) => m.uid === uid);

    if (!isOwner && !userMember) {
      return reply.code(403).send({ error: "access denied" });
    }

    return world.members.map((m) => ({
      uid: m.uid,
      email: m.email,
      displayName: m.displayName,
      role: m.role,
      addedAt: m.addedAt,
    }));
  });

  // DELETE /worlds/:worldId/members/:userId - remove member
  app.delete<{
    Params: { worldId: string; userId: string };
  }>("/worlds/:worldId/members/:userId", async (req, reply) => {
    const uid = req.user!.uid;
    const { worldId, userId } = req.params;

    let worldObjectId: ObjectId;
    try {
      worldObjectId = new ObjectId(worldId);
    } catch {
      return reply.code(400).send({ error: "invalid worldId" });
    }

    const world = await Worlds.findOne({ _id: worldObjectId });
    if (!world) {
      return reply.code(404).send({ error: "world not found" });
    }

    // Ensure members array exists
    if (!world.members || !Array.isArray(world.members)) {
      world.members = [];
    }

    // Check if user has permission (must be owner or admin)
    const isOwner = world.ownerUid === uid;
    const userMember = world.members.find((m) => m.uid === uid);

    if (!isOwner && (!userMember || !["owner", "admin"].includes(userMember.role))) {
      return reply
        .code(403)
        .send({ error: "only owners and admins can remove members" });
    }

    // Can't remove the owner
    const targetMember = world.members.find((m) => m.uid === userId);
    if (targetMember?.role === "owner") {
      return reply.code(400).send({ error: "cannot remove owner" });
    }

    const now = new Date();

    await Worlds.updateOne(
      { _id: worldObjectId },
      {
        $pull: { members: { uid: userId } },
        $inc: { "stats.collaboratorCount": -1 },
        $set: { updatedAt: now },
      }
    );

    await WorldActivity.insertOne({
      _id: new ObjectId(),
      worldId: worldObjectId,
      actorUid: uid,
      actorName: req.user!.name || req.user!.email || 'User',
      type: "member_removed",
      meta: { removedUid: userId },
      createdAt: now,
    });

    return { ok: true };
  });

  // PATCH /worlds/:worldId/members/:userId - update member role
  app.patch<{
    Params: { worldId: string; userId: string };
    Body: { role: "admin" | "editor" };
  }>("/worlds/:worldId/members/:userId", async (req, reply) => {
    const uid = req.user!.uid;
    const { worldId, userId } = req.params;
    const { role } = req.body;

    if (!["admin", "editor"].includes(role)) {
      return reply.code(400).send({ error: "role must be admin or editor" });
    }

    let worldObjectId: ObjectId;
    try {
      worldObjectId = new ObjectId(worldId);
    } catch {
      return reply.code(400).send({ error: "invalid worldId" });
    }

    const world = await Worlds.findOne({ _id: worldObjectId });
    if (!world) {
      return reply.code(404).send({ error: "world not found" });
    }

    // Ensure members array exists
    if (!world.members || !Array.isArray(world.members)) {
      world.members = [];
    }

    // Check if user has permission (must be owner or admin)
    const isOwner = world.ownerUid === uid;
    const userMember = world.members.find((m) => m.uid === uid);

    if (!isOwner && (!userMember || !["owner", "admin"].includes(userMember.role))) {
      return reply
        .code(403)
        .send({ error: "only owners and admins can update roles" });
    }

    // Can't change owner role
    const targetMember = world.members.find((m) => m.uid === userId);
    if (targetMember?.role === "owner") {
      return reply.code(400).send({ error: "cannot change owner role" });
    }

    const now = new Date();

    await Worlds.updateOne(
      { _id: worldObjectId, "members.uid": userId },
      {
        $set: { "members.$.role": role, updatedAt: now },
      }
    );

    await WorldActivity.insertOne({
      _id: new ObjectId(),
      worldId: worldObjectId,
      actorUid: uid,
      actorName: req.user!.name || req.user!.email || 'User',
      type: "member_role_updated",
      meta: { targetUid: userId, newRole: role },
      createdAt: now,
    });

    return { ok: true };
  });
};
