import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../_lib/respond.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await withAuth(req, res, ["DELETE"], async (user, { Worlds, Pages, PageContent, Favorites, WorldActivity, WorldInvitations }) => {
    const uid = user.uid;

    // Find all worlds this user owns
    const ownedWorlds = await Worlds.find({ ownerUid: uid }).toArray();
    const ownedWorldIds = ownedWorlds.map((w) => w._id);

    if (ownedWorldIds.length > 0) {
      // Cascade-delete everything belonging to owned worlds
      await Promise.all([
        Pages.deleteMany({ worldId: { $in: ownedWorldIds } }),
        PageContent.deleteMany({ worldId: { $in: ownedWorldIds } }),
        Favorites.deleteMany({ worldId: { $in: ownedWorldIds } }),
        WorldActivity.deleteMany({ worldId: { $in: ownedWorldIds } }),
        WorldInvitations.deleteMany({ worldId: { $in: ownedWorldIds } }),
        Worlds.deleteMany({ _id: { $in: ownedWorldIds } }),
      ]);
    }

    // Remove user from member arrays of worlds they belong to (but don't own)
    await Worlds.updateMany(
      { "members.uid": uid },
      {
        $pull: { members: { uid } as never },
        $inc: { "stats.collaboratorCount": -1 },
      }
    );

    // Delete any favorites the user created in other worlds
    await Favorites.deleteMany({ uid });

    res.status(200).json({ ok: true });
  });
}
