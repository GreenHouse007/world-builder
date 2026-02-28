import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../_lib/respond";
import { ObjectId } from "../../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await withAuth(req, res, ["POST"], async (user, { Worlds, WorldInvitations, WorldActivity }) => {
    const inviteId = req.query.inviteId as string;
    const uid = user.uid;
    const email = user.email;

    let inviteObjectId: ObjectId;
    try {
      inviteObjectId = new ObjectId(inviteId);
    } catch {
      res.status(400).json({ error: "invalid inviteId" }); return;
    }

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

    await WorldInvitations.updateOne(
      { _id: inviteObjectId },
      { $set: { status: "accepted", respondedAt: now } }
    );

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
}
