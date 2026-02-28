import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../_lib/respond";
import { ObjectId } from "../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawParams = req.query.params;
  const params = Array.isArray(rawParams) ? rawParams : rawParams ? [rawParams] : [];
  const [inviteId, action] = params;

  if (!inviteId) {
    // GET /api/invitations — list user's pending invitations
    await withAuth(req, res, ["GET"], async (user, { WorldInvitations }) => {
      const email = user.email;
      const invites = await WorldInvitations.find({ inviteeEmail: email, status: "pending" })
        .sort({ createdAt: -1 })
        .toArray();

      res.status(200).json(invites.map((inv) => ({
        _id: inv._id.toString(),
        worldId: inv.worldId.toString(),
        worldName: inv.worldName,
        inviterEmail: inv.inviterEmail,
        role: inv.role,
        createdAt: inv.createdAt,
      })));
    });
    return;
  }

  let inviteObjectId: ObjectId;
  try {
    inviteObjectId = new ObjectId(inviteId);
  } catch {
    res.status(400).json({ error: "invalid inviteId" });
    return;
  }

  // POST /api/invitations/:inviteId/accept
  if (action === "accept") {
    await withAuth(req, res, ["POST"], async (user, { Worlds, WorldInvitations, WorldActivity }) => {
      const uid = user.uid;
      const email = user.email;

      const invite = await WorldInvitations.findOne({ _id: inviteObjectId });
      if (!invite) { res.status(404).json({ error: "invitation not found" }); return; }
      if (invite.inviteeEmail !== email) { res.status(403).json({ error: "invitation not for you" }); return; }
      if (invite.status !== "pending") { res.status(400).json({ error: "invitation already responded to" }); return; }

      const now = new Date();

      await Worlds.updateOne(
        { _id: invite.worldId },
        {
          $push: {
            members: {
              uid,
              email: email || undefined,
              displayName: user.name || undefined,
              role: invite.role,
              addedAt: now,
            },
          },
          $inc: { "stats.collaboratorCount": 1 },
          $set: { updatedAt: now },
        }
      );

      await WorldInvitations.updateOne({ _id: inviteObjectId }, { $set: { status: "accepted", respondedAt: now } });

      await WorldActivity.insertOne({
        _id: new ObjectId(),
        worldId: invite.worldId,
        actorUid: uid,
        actorName: user.name || user.email || "User",
        type: "member_joined",
        meta: { role: invite.role },
        createdAt: now,
      });

      res.status(200).json({ ok: true });
    });
    return;
  }

  // POST /api/invitations/:inviteId/reject
  if (action === "reject") {
    await withAuth(req, res, ["POST"], async (user, { WorldInvitations }) => {
      const email = user.email;

      const invite = await WorldInvitations.findOne({ _id: inviteObjectId });
      if (!invite) { res.status(404).json({ error: "invitation not found" }); return; }
      if (invite.inviteeEmail !== email) { res.status(403).json({ error: "invitation not for you" }); return; }
      if (invite.status !== "pending") { res.status(400).json({ error: "invitation already responded to" }); return; }

      await WorldInvitations.updateOne({ _id: inviteObjectId }, { $set: { status: "rejected", respondedAt: new Date() } });

      res.status(200).json({ ok: true });
    });
    return;
  }

  res.status(404).json({ error: "not found" });
}
