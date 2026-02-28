import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../_lib/respond";
import { ObjectId } from "../../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await withAuth(req, res, ["GET", "POST"], async (user, { Worlds, WorldInvitations, WorldActivity }) => {
    const worldId = req.query.worldId as string;
    const uid = user.uid;

    let worldObjectId: ObjectId;
    try {
      worldObjectId = new ObjectId(worldId);
    } catch {
      res.status(400).json({ error: "invalid worldId" }); return;
    }

    if (req.method === "GET") {
      // GET /worlds/:worldId/invitations — list pending invitations for this world
      const world = await Worlds.findOne({ _id: worldObjectId });
      if (!world) { res.status(404).json({ error: "world not found" }); return; }

      const isOwner = world.ownerUid === uid;
      const userMember = (world.members || []).find((m) => m.uid === uid);
      if (!isOwner && !userMember) { res.status(403).json({ error: "forbidden" }); return; }

      const invites = await WorldInvitations.find({
        worldId: worldObjectId,
        status: "pending",
      }).toArray();

      res.status(200).json(
        invites.map((inv) => ({
          _id: inv._id.toString(),
          worldId: inv.worldId.toString(),
          worldName: inv.worldName,
          inviterEmail: inv.inviterEmail,
          inviteeEmail: inv.inviteeEmail,
          role: inv.role,
          createdAt: inv.createdAt,
        }))
      );
      return;
    }

    // POST — send invitation
    const { email: inviteeEmail, role } = req.body as { email: string; role: "admin" | "editor" };

    if (!inviteeEmail || !role) {
      res.status(400).json({ error: "email and role are required" }); return;
    }
    if (!["admin", "editor"].includes(role)) {
      res.status(400).json({ error: "role must be admin or editor" }); return;
    }

    const world = await Worlds.findOne({ _id: worldObjectId });
    if (!world) { res.status(404).json({ error: "world not found" }); return; }

    if (!world.members || !Array.isArray(world.members)) world.members = [];

    const isOwner = world.ownerUid === uid;
    const userMember = world.members.find((m) => m.uid === uid);
    if (!isOwner && (!userMember || !["owner", "admin"].includes(userMember.role))) {
      res.status(403).json({ error: "only owners and admins can invite" }); return;
    }

    const existingMember = world.members.find(
      (m) => m.uid === inviteeEmail || m.uid.includes(inviteeEmail)
    );
    if (existingMember) { res.status(400).json({ error: "user already has access" }); return; }

    const existingInvite = await WorldInvitations.findOne({
      worldId: worldObjectId,
      inviteeEmail,
      status: "pending",
    });
    if (existingInvite) {
      res.status(400).json({ error: "invitation already sent to this email" }); return;
    }

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
}
