import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Loader2, Eye, EyeOff, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

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

        <form onSubmit={submit} className="p-6 flex flex-col gap-4">
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
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-white/25">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          <button onClick={() => setLocation("/")}
            className="w-full h-11 rounded-xl border border-white/[0.10] hover:bg-white/[0.04] text-white/60 hover:text-white text-sm transition-colors">
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
