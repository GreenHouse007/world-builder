import { useState, useEffect } from "react";
import { api } from "../../services/http";
import { useWorlds } from "../../store/worlds";

interface Invitation {
  _id: string;
  worldId: string;
  worldName: string;
  inviterEmail: string;
  role: "admin" | "editor";
  createdAt: string;
}

export function InvitationsWidget() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { fetchWorlds } = useWorlds();

  // Fetch invitations on mount
  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    setIsLoading(true);
    try {
      const data = await api<Invitation[]>("/invitations");
      setInvitations(data);
    } catch (err) {
      console.error("Failed to fetch invitations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (inviteId: string) => {
    try {
      await api(`/invitations/${inviteId}/accept`, {
        method: "POST",
      });

      // Remove from local state
      setInvitations((prev) => prev.filter((inv) => inv._id !== inviteId));

      // Refresh worlds list to show the new world
      await fetchWorlds();

      alert("Invitation accepted! The world has been added to your list.");
    } catch (err) {
      console.error("Failed to accept invitation:", err);
      alert("Failed to accept invitation");
    }
  };

  const handleReject = async (inviteId: string) => {
    try {
      await api(`/invitations/${inviteId}/reject`, {
        method: "POST",
      });

      // Remove from local state
      setInvitations((prev) => prev.filter((inv) => inv._id !== inviteId));
    } catch (err) {
      console.error("Failed to reject invitation:", err);
      alert("Failed to reject invitation");
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="bg-white/3 border border-green-500/30 rounded-3xl p-4 text-xs">
        <div className="font-medium text-slate-100 flex items-center gap-2">
          📬 Pending Invitations
        </div>
        <p className="mt-2 text-slate-400">Loading invitations...</p>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="bg-white/3 border border-green-500/30 rounded-3xl p-4 text-xs">
        <div className="font-medium text-slate-100 flex items-center gap-2">
          📬 Pending Invitations
        </div>
        <p className="mt-2 text-slate-400">
          No pending invitations. When someone invites you to collaborate on a
          world, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/3 border border-green-500/30 rounded-3xl p-4 text-xs">
      <div className="font-medium text-slate-100 flex items-center gap-2">
        📬 Pending Invitations ({invitations.length})
      </div>

      <div className="mt-3 space-y-2">
        {invitations.map((invite) => (
          <div
            key={invite._id}
            className="bg-white/5 border border-white/10 rounded-lg p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-200 truncate">
                  {invite.worldName}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  From:{" "}
                  <span className="text-slate-300">
                    {invite.inviterEmail.split("@")[0]}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Role:{" "}
                  <span className="text-slate-300 capitalize">
                    {invite.role}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {formatRelativeTime(invite.createdAt)}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleAccept(invite._id)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-green-500/90 hover:bg-green-500 text-white text-[11px] transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => handleReject(invite._id)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
