import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../_lib/respond";

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
}
