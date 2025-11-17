import { useState } from "react";
import { useAuth } from "../../store/auth";
import { useWorlds } from "../../store/worlds";
import { usePages } from "../../store/pages";
import { updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../lib/firebase";

interface DeleteModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteAccountModal({ onClose, onConfirm }: DeleteModalProps) {
  const [confirmText, setConfirmText] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0a0f1a] border border-red-500/30 rounded-3xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-red-400 mb-2">Delete Account</h2>
        <p className="text-slate-300 text-sm mb-4">
          This action cannot be undone. All your worlds, pages, and data will be permanently deleted.
        </p>
        <p className="text-slate-400 text-sm mb-4">
          Type <span className="font-semibold text-slate-200">delete</span> to confirm:
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-100 text-sm mb-4 outline-none focus:border-red-500/50"
          placeholder="Type 'delete'"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmText !== "delete"}
            className="flex-1 px-4 py-2 rounded-lg bg-red-500/90 hover:bg-red-500 text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserSettings() {
  const { user, logout } = useAuth();
  const { worlds } = useWorlds();
  const { pages } = usePages();
  const [username, setUsername] = useState(user?.name || "");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveUsername = async () => {
    setIsSaving(true);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: username });
        // Update local state
        await useAuth.getState().setUserFromFirebase(auth.currentUser);
      }
    } catch (error) {
      console.error("Failed to update username:", error);
      alert("Failed to update username");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) {
      alert("No email associated with this account");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert(`Password reset email sent to ${user.email}`);
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      alert("Failed to send password reset email");
    }
  };

  const handleDeleteAccount = async () => {
    // TODO: API call to delete account
    console.log("Deleting account...");
    setShowDeleteModal(false);
    await logout();
  };

  // Calculate stats
  const worldCount = worlds.length;
  const totalPages = pages.length;

  return (
    <div className="grid grid-cols-[minmax(0,2.2fr)_minmax(260px,0.9fr)] gap-6 pt-6">
      {/* Left: Main settings */}
      <section className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
          <div className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
            Profile Settings
          </div>
          <h2 className="mt-1 text-2xl font-semibold text-slate-100">
            Your Account
          </h2>

          <div className="mt-6 space-y-4">
            {/* Email (read-only) */}
            <div>
              <label className="block text-xs text-slate-400 mb-2">Email</label>
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-300 text-sm">
                {user?.email || "No email"}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs text-slate-400 mb-2">
                Username (displayed in activity logs)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-100 text-sm outline-none focus:border-indigo-500/50"
                  placeholder="Enter username"
                />
                <button
                  onClick={handleSaveUsername}
                  disabled={isSaving || username === user?.name}
                  className="px-4 py-2 rounded-lg bg-indigo-500/90 hover:bg-indigo-500 text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <div className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase mb-4">
            Your Stats
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
              <div className="text-3xl font-semibold text-indigo-400">{worldCount}</div>
              <div className="text-xs text-slate-400 mt-1">Worlds Created</div>
            </div>
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
              <div className="text-3xl font-semibold text-emerald-400">{totalPages}</div>
              <div className="text-xs text-slate-400 mt-1">Total Pages</div>
            </div>
          </div>

          {/* Time spent per world */}
          {worlds.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-slate-400 mb-2">Time Spent Building</div>
              <div className="space-y-2">
                {worlds.slice(0, 5).map((world) => (
                  <div
                    key={world._id}
                    className="flex items-center justify-between bg-white/3 border border-white/8 rounded-lg px-3 py-2"
                  >
                    <span className="text-sm text-slate-300 truncate">{world.name}</span>
                    <span className="text-xs text-slate-500">
                      {/* TODO: Calculate actual time */}
                      {Math.floor(Math.random() * 10)}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Account Actions */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <div className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase mb-4">
            Account Actions
          </div>
          <div className="space-y-3">
            <button
              onClick={handleResetPassword}
              className="w-full px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-sm text-left transition-colors"
            >
              🔑 Reset Password
            </button>
            <button
              onClick={logout}
              className="w-full px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-sm text-left transition-colors"
            >
              🚪 Sign Out
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full px-4 py-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-left transition-colors"
            >
              🗑️ Delete Account
            </button>
          </div>
        </div>
      </section>

      {/* Right: Info widgets */}
      <aside className="space-y-4 text-xs">
        <div className="bg-white/3 border border-white/8 rounded-3xl p-4">
          <div className="font-medium text-slate-100">Account Info</div>
          <ul className="mt-2 space-y-1 text-slate-400">
            <li>📧 Email is managed by Firebase Auth</li>
            <li>🔒 Password resets are sent to your email</li>
            <li>⚠️ Account deletion is permanent</li>
          </ul>
        </div>

        <div className="bg-white/3 border border-indigo-500/30 rounded-3xl p-4">
          <div className="font-medium text-slate-100">Privacy</div>
          <p className="mt-2 text-slate-400">
            Your data is private. Only you can access your worlds and pages.
          </p>
        </div>
      </aside>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
        />
      )}
    </div>
  );
}
