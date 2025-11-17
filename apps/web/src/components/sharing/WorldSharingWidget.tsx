import React, { useState, useEffect } from "react";
import { useAuth } from "../../store/auth";
import { useWorlds } from "../../store/worlds";
import { api } from "../../services/http";
import { ShareWorldModal } from "./ShareWorldModal";

interface Member {
  uid: string;
  email?: string;
  displayName?: string;
  role: "owner" | "admin" | "editor" | "viewer";
  addedAt: string;
}

export function WorldSharingWidget() {
  const { user } = useAuth();
  const { currentWorldId, worlds } = useWorlds();
  const [members, setMembers] = useState<Member[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  const currentWorld = worlds.find((w) => w._id === currentWorldId);

  // Check if user is owner of the world (fallback if members list fails)
  const isOwner = currentWorld?.ownerUid === user?.uid;

  const currentUserMember = members.find((m) => m.uid === user?.uid);
  const canManageMembers = isOwner || currentUserMember?.role === "owner" || currentUserMember?.role === "admin";

  // Create complete members list including the owner
  const allMembers = React.useMemo(() => {
    if (!currentWorld) return members;

    // Check if owner is already in the members list
    const ownerInList = members.some((m) => m.uid === currentWorld.ownerUid);

    if (ownerInList) {
      return members;
    }

    // Add owner as first member (try to find email from worlds data)
    const worldOwner = currentWorld.members?.find((m) => m.uid === currentWorld.ownerUid);
    const ownerMember: Member = {
      uid: currentWorld.ownerUid,
      email: worldOwner?.email,
      displayName: worldOwner?.displayName,
      role: "owner",
      addedAt: currentWorld.createdAt || new Date().toISOString(),
    };

    return [ownerMember, ...members];
  }, [currentWorld, members]);

  // Fetch members when world changes
  useEffect(() => {
    if (!currentWorldId) {
      setMembers([]);
      return;
    }

    api<Member[]>(`/worlds/${currentWorldId}/members`)
      .then((data) => setMembers(data))
      .catch((err) => console.error("[WorldSharingWidget] Failed to fetch members:", err));
  }, [currentWorldId]);

  const handleRemoveMember = async (userId: string) => {
    if (!currentWorldId) return;
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      await api(`/worlds/${currentWorldId}/members/${userId}`, {
        method: "DELETE",
      });

      // Update local state
      setMembers((prev) => prev.filter((m) => m.uid !== userId));
    } catch (err) {
      console.error("Failed to remove member:", err);
      alert("Failed to remove member");
    }
  };

  const handleUpdateRole = async (userId: string, newRole: "admin" | "editor") => {
    if (!currentWorldId) return;

    try {
      await api(`/worlds/${currentWorldId}/members/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });

      // Update local state
      setMembers((prev) =>
        prev.map((m) => (m.uid === userId ? { ...m, role: newRole } : m))
      );
    } catch (err) {
      console.error("Failed to update role:", err);
      alert("Failed to update role");
    }
  };

  if (!currentWorldId) {
    return (
      <div className="bg-white/3 border border-purple-500/30 rounded-3xl p-4 text-xs">
        <div className="font-medium text-slate-100 flex items-center gap-2">
          👥 World Sharing
        </div>
        <p className="mt-2 text-slate-400">
          Select a world to manage sharing settings.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/3 border border-purple-500/30 rounded-3xl p-4 text-xs">
      <div className="font-medium text-slate-100 flex items-center gap-2">
        👥 World Sharing
      </div>

      {/* Current members */}
      <div className="mt-3 space-y-2">
        <div className="text-[10px] text-slate-400 uppercase tracking-wide">
          Members ({allMembers.length})
        </div>
        {allMembers.length > 0 ? (
          <div className="space-y-1.5">
            {allMembers.map((member) => {
              const isOwner = member.role === "owner";
              const isCurrentUser = member.uid === user?.uid;
              // Show display name, email username, or fallback
              const displayName = isCurrentUser && user?.name
                ? user.name
                : member.displayName
                ? member.displayName
                : member.email
                ? member.email.split("@")[0]
                : isCurrentUser && user?.email
                ? user.email.split("@")[0]
                : "User";

              return (
                <div
                  key={member.uid}
                  className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-300 truncate">
                      {displayName}
                      {isCurrentUser && (
                        <span className="text-slate-500 ml-1">(you)</span>
                      )}
                    </div>
                  </div>

                  {/* Role selector or display */}
                  {canManageMembers && !isOwner && !isCurrentUser ? (
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleUpdateRole(
                          member.uid,
                          e.target.value as "admin" | "editor"
                        )
                      }
                      className="ml-2 bg-white/10 border border-white/20 rounded px-2 py-1 text-[10px] text-slate-300 outline-none focus:border-purple-500/50"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                    </select>
                  ) : (
                    <span className="ml-2 text-[10px] text-slate-400 capitalize">
                      {member.role}
                    </span>
                  )}

                  {/* Remove button */}
                  {canManageMembers && !isOwner && !isCurrentUser && (
                    <button
                      onClick={() => handleRemoveMember(member.uid)}
                      className="ml-2 text-red-400 hover:text-red-300 transition-colors"
                      title="Remove member"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-400">No members yet.</p>
        )}
      </div>

      {/* Invite button */}
      {canManageMembers && (
        <div className="mt-4 pt-3 border-t border-white/10 flex justify-center">
          <button
            onClick={() => setShowShareModal(true)}
            className="w-1/2 px-4 py-2.5 rounded-lg bg-purple-700/90 hover:bg-purple-700 text-white text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>✉️</span>
            <span>Invite Members</span>
          </button>
        </div>
      )}

      {/* Info for non-admins */}
      {!canManageMembers && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-slate-400 text-[10px]">
            Only owners and admins can invite and manage members.
          </p>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && currentWorld && (
        <ShareWorldModal
          worldId={currentWorldId!}
          worldName={currentWorld.name}
          onClose={() => setShowShareModal(false)}
          onSuccess={() => {
            // Refresh members list after successful invite
            api<Member[]>(`/worlds/${currentWorldId}/members`)
              .then((data) => setMembers(data))
              .catch((err) => console.error("Failed to fetch members:", err));
          }}
        />
      )}
    </div>
  );
}
