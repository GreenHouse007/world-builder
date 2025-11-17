import { useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../services/http";

interface ShareWorldModalProps {
  worldId: string;
  worldName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ShareWorldModal({ worldId, worldName, onClose, onSuccess }: ShareWorldModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor">("editor");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError("");
    setSuccess(false);
    setIsSubmitting(true);

    try {
      await api(`/worlds/${worldId}/invitations`, {
        method: "POST",
        body: JSON.stringify({ email, role }),
      });

      setSuccess(true);
      setEmail("");

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Auto-close after 2 seconds on success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      // Parse error message
      let errorMessage = "Failed to send invitation";

      if (err.message) {
        errorMessage = err.message;
      }

      // Check for specific error types
      if (errorMessage.includes("not found") || errorMessage.includes("does not exist")) {
        errorMessage = "No user found with that email address";
      } else if (errorMessage.includes("already has access") || errorMessage.includes("already a member")) {
        errorMessage = "This user already has access to this world";
      } else if (errorMessage.includes("already sent") || errorMessage.includes("invitation already")) {
        errorMessage = "An invitation has already been sent to this email";
      }

      setError(errorMessage);
      console.error("Failed to send invitation:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]" onClick={onClose}>
      <div
        className="bg-[#0a0f1a] border border-purple-500/30 rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-purple-400">Share World</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <p className="text-slate-300 text-sm mb-1">
          Invite someone to collaborate on <span className="font-semibold text-purple-300">{worldName}</span>
        </p>
        <p className="text-slate-400 text-xs mb-4">
          They'll receive an invitation to join this world.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-100 text-sm outline-none focus:border-purple-500/50 transition-colors"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "editor")}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-100 text-sm outline-none focus:border-purple-500/50 transition-colors"
              disabled={isSubmitting}
            >
              <option value="editor">Editor - Can edit content</option>
              <option value="admin">Admin - Can edit and manage members</option>
            </select>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
              <p className="text-green-300 text-sm">
                ✓ Invitation sent successfully!
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-sm transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!email || isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg bg-purple-500/90 hover:bg-purple-500 text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-slate-400 text-xs">
            💡 The recipient must have an account with this email to accept the invitation.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
