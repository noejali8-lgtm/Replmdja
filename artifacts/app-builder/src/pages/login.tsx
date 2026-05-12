import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Loader2, Eye, EyeOff, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { refetch } = useAuth();
  const [mode, setMode]         = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: Record<string, string> = { username, password };
      if (mode === "register" && displayName) body.displayName = displayName;
      const res = await fetch(`${BASE_URL}/api/auth/${mode}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      await refetch();
      setLocation("/");
    } catch {
      setError("Network error — is the API server running?");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGitHub = () => {
    window.location.href = `${BASE_URL}/api/auth/github`;
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-8 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Terminal size={22} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">Replit IDE</h1>
          <p className="text-sm text-white/40">Code anywhere, deploy everywhere</p>
        </div>
      </motion.div>

      {/* Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="w-full max-w-sm bg-[#161b22] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">

        {/* Tab switcher */}
        <div className="flex border-b border-white/[0.06]">
          {(["login", "register"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }}
              className={cn(
                "flex-1 py-3.5 text-sm font-medium transition-colors",
                mode === m ? "text-white border-b-2 border-blue-500" : "text-white/40 hover:text-white/70"
              )}>
              {m === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        {/* GitHub OAuth button */}
        <div className="px-6 pt-5 pb-2">
          <button
            onClick={loginWithGitHub}
            className="w-full h-11 rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-white/[0.10] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2.5">
            <GitHubIcon size={18} />
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 px-6 py-2">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-xs text-white/25">or</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        <form onSubmit={submit} className="px-6 pb-5 flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {mode === "register" && (
              <motion.div key="dname"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}>
                <label className="block text-xs text-white/50 mb-1.5">Display name</label>
                <input
                  value={displayName} onChange={e => setDisplayName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 h-11 text-sm text-white placeholder:text-white/25 outline-none focus:border-blue-500/60 transition-colors"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Username</label>
            <input
              value={username} onChange={e => setUsername(e.target.value)}
              placeholder="your_username"
              autoComplete="username"
              required
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 h-11 text-sm text-white placeholder:text-white/25 outline-none focus:border-blue-500/60 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Password</label>
            <div className="relative">
              <input
                value={password} onChange={e => setPassword(e.target.value)}
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 pr-11 h-11 text-sm text-white placeholder:text-white/25 outline-none focus:border-blue-500/60 transition-colors"
              />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </motion.p>
          )}

          <button type="submit" disabled={loading || !username || !password}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        {/* Guest option */}
        <div className="px-6 pb-6">
          <button onClick={() => setLocation("/")}
            className="w-full h-10 rounded-xl border border-white/[0.06] hover:bg-white/[0.03] text-white/40 hover:text-white/60 text-xs transition-colors">
            Continue as guest
          </button>
        </div>
      </motion.div>

      <p className="mt-6 text-xs text-white/20 text-center max-w-xs">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
