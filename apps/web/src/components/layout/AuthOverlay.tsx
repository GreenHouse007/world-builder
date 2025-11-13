// apps/web/src/components/layout/AuthOverlay.tsx
import { useState, type FormEvent } from "react";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";
import { useAuth } from "../../store/auth";

export function AuthOverlay() {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("adventurebyalex@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If auth is still bootstrapping, or user is signed in, don't show overlay
  if (authLoading || user) return null;

  const handleEmailSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will update useAuth & hide overlay
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to sign in.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setSubmitting(true);

    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle store
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Google sign-in failed.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#02030a]">
      <div className="w-[92%] max-w-6xl bg-gradient-to-br from-[#050716] to-[#040816] rounded-3xl p-10 flex gap-10 shadow-2xl border border-white/5">
        {/* Left: marketing */}
        <div className="flex-1 space-y-6 text-slate-100">
          <div className="text-xs tracking-[0.2em] text-slate-400 uppercase">
            Enfield
          </div>
          <h1 className="text-4xl font-semibold leading-tight">
            Build immersive universes
            <span className="block text-indigo-400">
              with clarity and poetic focus.
            </span>
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Sign in to unlock nested worlds, autosave, exports, and a focused
            writing space for your campaigns and epics.
          </p>
        </div>

        {/* Right: auth card */}
        <div className="w-[340px] bg-[#050818] rounded-3xl p-6 border border-white/8 flex flex-col justify-between">
          <div>
            <div className="text-sm font-medium text-slate-200">
              Sign in to continue
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Worlds are securely tied to your account via Firebase
              Authentication.
            </p>

            <form onSubmit={handleEmailSignIn} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase tracking-wide text-slate-500">
                  Email
                </label>
                <input
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-slate-100 outline-none focus:border-indigo-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] uppercase tracking-wide text-slate-500">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-slate-100 outline-none focus:border-indigo-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-sm font-medium text-white transition"
              >
                {submitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={submitting}
              className="w-full mt-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-100 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>G</span>
              <span>Sign in with Google</span>
            </button>

            {error && (
              <div className="mt-2 text-[10px] text-red-400">{error}</div>
            )}
          </div>

          <div className="mt-4 border-t border-white/5 pt-3 text-[10px] text-slate-500">
            Storycraft Beta • Backed by Firebase • Your data stays in your
            worlds.
          </div>
        </div>
      </div>
    </div>
  );
}
