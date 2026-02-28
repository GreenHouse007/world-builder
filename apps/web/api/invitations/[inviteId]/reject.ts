import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../_lib/respond";
import { ObjectId } from "../../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await withAuth(req, res, ["POST"], async (user, { WorldInvitations }) => {
    const inviteId = req.query.inviteId as string;
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

    await WorldInvitations.updateOne(
      { _id: inviteObjectId },
      { $set: { status: "rejected", respondedAt: new Date() } }
    );

    res.status(200).json({ ok: true });
  });
}
