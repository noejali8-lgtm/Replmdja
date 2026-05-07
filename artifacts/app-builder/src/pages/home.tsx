import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Lock, Globe, Download, ChevronDown, X, CheckCircle2, Loader2, GitBranch, FileText, Package, Zap, Layers, BookOpen, Compass, ChevronRight } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { CategoryChips } from "@/components/CategoryChips";
import { CreateInput } from "@/components/CreateInput";
import { cn } from "@/lib/utils";

function isGitHubUrl(text: string): boolean {
  const t = text.trim();
  return /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/.test(t);
}

function normalizeGitHubUrl(raw: string): string {
  const t = raw.trim().replace(/^https?:\/\//, "").replace(/^github\.com\//, "");
  return `https://github.com/${t.replace(/\.git$/, "")}`;
}

function ImportingScreen({ repoUrl, onDone }: { repoUrl: string; onDone: () => void }) {
  const repoName = repoUrl.replace("https://github.com/", "");
  const [phase, setPhase] = useState<"importing" | "setting-up" | "done">("importing");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("setting-up"), 2200);
    const t2 = setTimeout(() => setPhase("done"), 4000);
    const t3 = setTimeout(() => onDone(), 4600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0d1117] flex flex-col"
    >
      {/* Top badge */}
      <div className="px-4 pt-12">
        <AnimatePresence mode="wait">
          {phase === "importing" && (
            <motion.div
              key="importing-badge"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2.5 bg-[#161b22] border border-white/10 rounded-2xl px-4 py-3"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/70 shrink-0"
              />
              <span className="text-sm text-white/70 font-medium">Setting up your project from Replit...</span>
            </motion.div>
          )}
          {phase === "setting-up" && (
            <motion.div
              key="setting-badge"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2.5 bg-[#161b22] border border-white/10 rounded-2xl px-4 py-3"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/70 shrink-0"
              />
              <span className="text-sm text-white/70 font-medium">Setting up your project from Replit...</span>
            </motion.div>
          )}
          {phase === "done" && (
            <motion.div
              key="done-badge"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 bg-[#161b22] border border-white/10 rounded-2xl px-4 py-3"
            >
              <CheckCircle2 size={16} className="text-white/70 shrink-0" />
              <span className="text-sm text-white/70 font-medium">Successfully imported from Replit</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Center animation */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <AnimatePresence mode="wait">
          {phase === "importing" && (
            <motion.div
              key="squares"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="relative w-24 h-24">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute w-10 h-10 rounded-xl bg-[#f25022]"
                    style={{
                      top: i === 0 ? 0 : i === 1 ? "auto" : "auto",
                      bottom: i === 0 ? "auto" : i === 1 ? 0 : 0,
                      left: i === 0 ? 0 : i === 1 ? 0 : "auto",
                      right: i === 0 ? "auto" : i === 1 ? "auto" : 0,
                    }}
                    animate={{
                      scale: [1, 0.85, 1],
                      opacity: [0.9, 0.6, 0.9],
                    }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      delay: i * 0.22,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
              <p className="text-white/60 text-base font-medium tracking-wide">Importing...</p>
            </motion.div>
          )}

          {phase === "setting-up" && (
            <motion.div
              key="setting-up"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#6e40c9]/20 border border-[#6e40c9]/30 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 size={26} className="text-[#a78bfa]" />
                </motion.div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#6e40c9]/30 border border-[#6e40c9]/40 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-sm bg-[#a78bfa]" />
                </div>
                <p className="text-white/60 text-sm font-medium">Working.</p>
              </div>
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#6e40c9]/20 border border-[#6e40c9]/30 flex items-center justify-center">
                <div className="w-5 h-5 rounded bg-[#6e40c9]/30 border border-[#6e40c9]/40 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-sm bg-[#a78bfa]" />
                </div>
              </div>
              <p className="text-white/60 text-sm font-medium">Working.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Repo info */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/8 rounded-full">
          <SiGithub size={13} className="text-white/40 shrink-0" />
          <span className="text-xs text-white/40 font-mono truncate max-w-[200px]">{repoName}</span>
        </div>
      </div>
    </motion.div>
  );
}

function ImportFromGitHubSheet({ onClose, onImport }: { onClose: () => void; onImport: (url: string) => void }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [privacy, setPrivacy] = useState<"private" | "public">("private");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const username = (typeof localStorage !== "undefined" && localStorage.getItem("git_author_name")) || "username";
  const initial = username[0]?.toUpperCase() || "U";

  const normalize = (raw: string) => raw.trim().replace(/^https?:\/\//, "").replace(/^github\.com\//, "");

  const handleImport = async () => {
    const slug = normalize(repoUrl);
    if (!slug || !slug.includes("/")) { setError("Enter a valid GitHub URL — e.g. github.com/user/repo"); return; }
    setError("");
    setImporting(true);
    await new Promise(r => setTimeout(r, 300));
    onImport(`https://github.com/${slug}`);
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 360, damping: 38 }}
        className="relative w-full max-w-[480px] bg-[#1c1c1c] rounded-t-3xl overflow-hidden shadow-2xl z-10 border-t border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <div className="w-8" />
          <h2 className="text-xl font-bold text-white tracking-tight">Import From GitHub</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors rounded-full hover:bg-white/8">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 pb-8 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">GitHub URL</label>
            <input
              type="text" value={repoUrl}
              onChange={e => { setRepoUrl(e.target.value); setError(""); }}
              placeholder="github.com/user/repo"
              className={cn("w-full bg-transparent border rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors", error ? "border-red-400/60 focus:border-red-400" : "border-white/12 focus:border-white/30")}
              data-testid="input-github-repo-url" autoFocus
            />
            {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">Owner</label>
            <div className="flex items-center justify-between border border-white/12 rounded-xl px-4 py-3 bg-transparent">
              <ChevronDown size={16} className="text-white/40" />
              <div className="flex items-center gap-2.5">
                <span className="text-sm text-white font-medium">{username}</span>
                <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-white">{initial}</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">Privacy</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 border border-white/8 rounded-xl">
              {(["private", "public"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPrivacy(p)}
                  className={cn("flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all", privacy === p ? "bg-[#2563eb] text-white" : "text-white/40 hover:text-white/70")}
                  data-testid={`button-privacy-${p}`}
                >
                  {p === "private" ? <Lock size={14} /> : <Globe size={14} />}
                  {p === "private" ? "Private" : "Public"}
                </button>
              ))}
            </div>
            <p className="text-xs text-white/35 mt-2 text-center leading-relaxed">
              {privacy === "private" ? "Only you and collaborators can view and remix this Project." : "Anyone can view and remix this Project."}
            </p>
          </div>
          <button
            onClick={handleImport}
            disabled={importing || !repoUrl.trim()}
            className={cn("w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-sm font-semibold transition-all", importing ? "bg-white/8 text-white/40 cursor-not-allowed" : repoUrl.trim() ? "bg-[#2563eb] text-white hover:bg-blue-500 active:scale-[0.98]" : "bg-white/6 border border-white/8 text-white/30 cursor-not-allowed")}
            data-testid="button-import-repo"
          >
            {importing ? <><Loader2 size={15} className="animate-spin" /> Preparing...</> : <><Download size={15} /> Import</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importingRepo, setImportingRepo] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const handleChipSelect = (category: string) => {
    const newText = prompt.length > 0 ? `${prompt} ${category}` : `I want to make a ${category}`;
    setPrompt(newText);
  };

  const handleSubmit = () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    if (isGitHubUrl(trimmed)) {
      const url = normalizeGitHubUrl(trimmed);
      setPrompt("");
      setImportingRepo(url);
      return;
    }

    sessionStorage.setItem("chat_prompt", trimmed);
    setLocation("/chat");
  };

  const handleImportGithub = () => { setShowMenu(false); setShowImport(true); };
  const handleStartImport = (url: string) => { setShowImport(false); setImportingRepo(url); };
  const handleImportDone = () => {
    const slug = importingRepo!.replace("https://github.com/", "");
    sessionStorage.setItem("chat_prompt", `I've imported the GitHub repo https://github.com/${slug}. Analyze the project structure, explain what it does, and suggest what we can build or improve.`);
    sessionStorage.setItem("imported_repo", importingRepo!);
    setLocation("/chat");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full min-h-[100dvh] max-w-[480px] mx-auto w-full relative"
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-12 pb-2 relative">
        <div className="relative">
          <button
            className="p-2 -ml-2 text-white/50 hover:text-white transition-colors"
            onClick={() => setShowMenu((v) => !v)}
            data-testid="button-menu"
          >
            <MoreVertical size={22} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} data-testid="overlay-dismiss-menu" />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute left-0 top-10 bg-[#252525] border border-white/10 shadow-2xl rounded-xl overflow-hidden z-50 min-w-[200px]"
                >
                  <button
                    onClick={handleImportGithub}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors text-left"
                    data-testid="button-import-github"
                  >
                    <SiGithub size={16} className="text-white shrink-0" />
                    <p className="text-sm font-medium text-white leading-tight">Import from GitHub</p>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <span className="text-sm font-medium text-white/60">jnar7804's workspace</span>

        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center cursor-pointer" data-testid="avatar-user">
          <span className="text-sm font-bold text-white">N</span>
        </div>
      </header>

      {/* Greeting */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4">
          <h1 className="text-[28px] font-semibold text-white text-center leading-snug tracking-tight mb-6">
            Hi jnar7804,<br />
            what do you want to make?
          </h1>

          <div className="w-full overflow-x-auto no-scrollbar -mx-4 px-4">
            <CategoryChips onSelect={handleChipSelect} />
          </div>
        </div>

        {/* Input + Footer */}
        <div className="px-4 pb-[78px] space-y-3">
          <CreateInput value={prompt} onChange={setPrompt} onSubmit={handleSubmit} />

          {/* GitHub URL hint when user types a github link */}
          <AnimatePresence>
            {isGitHubUrl(prompt) && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#161b22] border border-white/10 rounded-xl"
              >
                <SiGithub size={14} className="text-white/60 shrink-0" />
                <span className="text-xs text-white/50 flex-1">GitHub URL detected — press send to import automatically</span>
                <Zap size={12} className="text-yellow-400/60 shrink-0" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick links row */}
          <div className="grid grid-cols-2 gap-2">
            <Link href="/templates">
              <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-white/4 border border-white/8 hover:bg-white/7 transition-colors cursor-pointer">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/25 flex items-center justify-center shrink-0">
                  <BookOpen size={13} className="text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white leading-tight">Templates</p>
                  <p className="text-[10px] text-white/35 truncate">قوالب جاهزة</p>
                </div>
                <ChevronRight size={12} className="text-white/20 ml-auto shrink-0" />
              </div>
            </Link>
            <Link href="/explore">
              <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-white/4 border border-white/8 hover:bg-white/7 transition-colors cursor-pointer">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/25 flex items-center justify-center shrink-0">
                  <Compass size={13} className="text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white leading-tight">Explore</p>
                  <p className="text-[10px] text-white/35 truncate">دليل Replit</p>
                </div>
                <ChevronRight size={12} className="text-white/20 ml-auto shrink-0" />
              </div>
            </Link>
            <Link href="/replit-agent">
              <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-white/4 border border-white/8 hover:bg-white/7 transition-colors cursor-pointer">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/25 flex items-center justify-center shrink-0">
                  <Zap size={13} className="text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white leading-tight">AI Agent</p>
                  <p className="text-[10px] text-white/35 truncate">بنّاء تلقائي</p>
                </div>
                <ChevronRight size={12} className="text-white/20 ml-auto shrink-0" />
              </div>
            </Link>
            <Link href="/pro-features">
              <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-white/4 border border-white/8 hover:bg-white/7 transition-colors cursor-pointer">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/25 flex items-center justify-center shrink-0">
                  <Layers size={13} className="text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white leading-tight">Pro Tools</p>
                  <p className="text-[10px] text-white/35 truncate">Nix · DB · Deploy</p>
                </div>
                <ChevronRight size={12} className="text-white/20 ml-auto shrink-0" />
              </div>
            </Link>
          </div>

          <div className="flex flex-col items-center gap-0.5 text-[13px] pb-2">
            <span className="text-white/40">Start creating for free</span>
            <a href="#" className="text-white/70 underline underline-offset-2 font-medium hover:text-white transition-colors">
              Join Replit Core to unlock more usage
            </a>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showImport && <ImportFromGitHubSheet onClose={() => setShowImport(false)} onImport={handleStartImport} />}
      </AnimatePresence>
      <AnimatePresence>
        {importingRepo && <ImportingScreen repoUrl={importingRepo} onDone={handleImportDone} />}
      </AnimatePresence>
    </motion.div>
  );
}
