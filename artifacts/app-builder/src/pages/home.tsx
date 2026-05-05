import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Lock, Globe, Download, ChevronDown, X, CheckCircle2, Loader2, GitBranch, FileText, Package, Zap } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { CategoryChips } from "@/components/CategoryChips";
import { CreateInput } from "@/components/CreateInput";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/* ── Import loading screen (full-screen, Replit-style) ── */
const IMPORT_STEPS = [
  { icon: <SiGithub size={14} />, label: "Connecting to GitHub" },
  { icon: <GitBranch size={14} />, label: "Cloning repository" },
  { icon: <FileText size={14} />, label: "Reading file tree" },
  { icon: <Package size={14} />, label: "Setting up workspace" },
  { icon: <Zap size={14} />, label: "Launching editor" },
];

function ImportingScreen({ repoUrl, onDone }: { repoUrl: string; onDone: () => void }) {
  const repoName = repoUrl.trim()
    .replace(/^https?:\/\//, "")
    .replace(/^github\.com\//, "")
    .replace(/\.git$/, "");
  const owner = repoName.split("/")[0] ?? "user";
  const repo = repoName.split("/")[1] ?? repoName;

  const [doneIdx, setDoneIdx] = useState(-1);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    let idx = 0;
    const advance = () => {
      if (idx >= IMPORT_STEPS.length) {
        setTimeout(onDone, 500);
        return;
      }
      setActiveIdx(idx);
      const delay = 600 + Math.random() * 500;
      setTimeout(() => {
        setDoneIdx(idx);
        idx++;
        setTimeout(advance, 200);
      }, delay);
    };
    setTimeout(advance, 300);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 border-b border-border/40">
        <div className="w-8 h-8 rounded-lg bg-foreground/10 border border-border/50 flex items-center justify-center">
          <SiGithub size={16} className="text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{repo || repoName}</p>
          <p className="text-xs text-muted-foreground/60 truncate">github.com/{owner}</p>
        </div>
        <div className="text-[10px] bg-blue-500/15 border border-blue-400/25 text-blue-400 px-2 py-1 rounded-full font-semibold">Importing</div>
      </div>

      {/* Steps */}
      <div className="flex-1 flex flex-col justify-center px-8 gap-1">
        {IMPORT_STEPS.map((step, i) => {
          const isDone = i <= doneIdx;
          const isActive = i === activeIdx && i > doneIdx;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: i <= activeIdx ? 1 : 0.3, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className="flex items-center gap-3 py-3"
            >
              <div className={cn(
                "w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-all duration-300",
                isDone
                  ? "bg-green-500/20 border-green-400/40 text-green-400"
                  : isActive
                  ? "bg-blue-500/20 border-blue-400/40 text-blue-400"
                  : "bg-secondary/30 border-border/40 text-muted-foreground/40"
              )}>
                {isDone ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
                    <CheckCircle2 size={14} className="text-green-400" />
                  </motion.div>
                ) : isActive ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  step.icon
                )}
              </div>
              <span className={cn(
                "text-sm font-medium transition-colors duration-200",
                isDone ? "text-green-400" : isActive ? "text-foreground" : "text-muted-foreground/40"
              )}>
                {step.label}
                {i === 1 && isActive && (
                  <span className="text-xs text-muted-foreground/50 ml-2 font-normal font-mono">
                    {repoName}
                  </span>
                )}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* File tree preview (animates in) */}
      <AnimatePresence>
        {doneIdx >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-5 mb-5 bg-card border border-border/50 rounded-2xl px-4 py-3 space-y-1.5"
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">File Tree</p>
            {["src/", "src/App.tsx", "src/main.tsx", "package.json", "README.md"].map((f, i) => (
              <motion.div
                key={f}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center gap-2"
              >
                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", f.endsWith("/") ? "bg-yellow-400/60" : "bg-blue-400/60")} />
                <span className="text-xs font-mono text-muted-foreground/70">{f}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Import from GitHub bottom sheet ── */
function ImportFromGitHubSheet({ onClose, onImport }: { onClose: () => void; onImport: (url: string) => void }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [privacy, setPrivacy] = useState<"private" | "public">("private");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const username =
    (typeof localStorage !== "undefined" && localStorage.getItem("git_author_name")) ||
    "username";
  const initial = username[0]?.toUpperCase() || "U";

  const normalize = (raw: string) => {
    return raw.trim()
      .replace(/^https?:\/\//, "")
      .replace(/^github\.com\//, "");
  };

  const handleImport = async () => {
    const slug = normalize(repoUrl);
    if (!slug || !slug.includes("/")) {
      setError("Enter a valid GitHub URL — e.g. github.com/user/repo");
      return;
    }
    setError("");
    setImporting(true);
    await new Promise(r => setTimeout(r, 400));
    onImport(`https://github.com/${slug}`);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 360, damping: 38 }}
        className="relative w-full max-w-[480px] bg-[#1a1a2e] rounded-t-3xl overflow-hidden shadow-2xl z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <div className="w-8" />
          <h2 className="text-xl font-bold text-white tracking-tight">Import From GitHub</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors rounded-full hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-5">

          {/* GitHub URL */}
          <div>
            <label className="block text-sm font-semibold text-white text-right mb-2">GitHub URL</label>
            <input
              type="text"
              value={repoUrl}
              onChange={e => { setRepoUrl(e.target.value); setError(""); }}
              placeholder="github.com/user/repo"
              className={cn(
                "w-full bg-transparent border rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/35 outline-none transition-colors",
                error ? "border-red-400/60 focus:border-red-400" : "border-white/15 focus:border-white/40"
              )}
              data-testid="input-github-repo-url"
              autoFocus
            />
            {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
          </div>

          {/* Owner */}
          <div>
            <label className="block text-sm font-semibold text-white text-right mb-2">Owner</label>
            <div className="flex items-center justify-between border border-white/15 rounded-xl px-4 py-3 bg-transparent">
              <ChevronDown size={16} className="text-white/50" />
              <div className="flex items-center gap-2.5">
                <span className="text-sm text-white font-medium">{username}</span>
                <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-white">{initial}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-semibold text-white text-right mb-2">Privacy</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
              <button
                onClick={() => setPrivacy("private")}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all",
                  privacy === "private" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-white/50 hover:text-white/80"
                )}
                data-testid="button-privacy-private"
              >
                <Lock size={14} />
                Private
              </button>
              <button
                onClick={() => setPrivacy("public")}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all",
                  privacy === "public" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-white/50 hover:text-white/80"
                )}
                data-testid="button-privacy-public"
              >
                <Globe size={14} />
                Public
              </button>
            </div>
            <p className="text-xs text-white/45 mt-2 text-center leading-relaxed">
              {privacy === "private"
                ? "Only you and collaborators can view and remix this Project."
                : "Anyone can view and remix this Project."}
            </p>
          </div>

          {/* Import button */}
          <button
            onClick={handleImport}
            disabled={importing || !repoUrl.trim()}
            className={cn(
              "w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-sm font-semibold transition-all",
              importing
                ? "bg-white/10 text-white/50 cursor-not-allowed"
                : repoUrl.trim()
                ? "bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.98] shadow-lg shadow-blue-500/20"
                : "bg-white/8 border border-white/10 text-white/40 cursor-not-allowed"
            )}
            data-testid="button-import-repo"
          >
            {importing ? (
              <><Loader2 size={15} className="animate-spin" /> Preparing...</>
            ) : (
              <><Download size={15} /> Import</>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Home page ── */
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
    sessionStorage.setItem("chat_prompt", trimmed);
    setLocation("/chat");
  };

  const handleImportGithub = () => {
    setShowMenu(false);
    setShowImport(true);
  };

  const handleStartImport = (url: string) => {
    setShowImport(false);
    setImportingRepo(url);
  };

  const handleImportDone = () => {
    const slug = importingRepo!.replace("https://github.com/", "");
    sessionStorage.setItem("chat_prompt", `I've imported the GitHub repo https://github.com/${slug}. Analyze the project structure, explain what it does, and suggest what we can build or improve.`);
    sessionStorage.setItem("imported_repo", importingRepo!);
    setLocation("/chat");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col h-full px-4 pt-12 pb-24 max-w-[480px] mx-auto w-full relative"
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-12">
        <div className="relative">
          <button
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowMenu((v) => !v)}
            data-testid="button-menu"
          >
            <MoreVertical size={24} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} data-testid="overlay-dismiss-menu" />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-10 bg-card border border-border shadow-xl rounded-xl overflow-hidden z-50 min-w-[200px]"
                >
                  <button
                    onClick={handleImportGithub}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/60 transition-colors text-left"
                    data-testid="button-import-github"
                  >
                    <SiGithub size={18} className="text-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground leading-tight">Import from GitHub</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Bring in your existing repositories</p>
                    </div>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <span className="text-sm font-medium text-muted-foreground">N's workspace</span>

        <Avatar className="w-8 h-8 border border-border cursor-pointer" data-testid="avatar-user">
          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">N</AvatarFallback>
        </Avatar>
      </header>

      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground leading-tight tracking-tight">
          Hi N,
          <br />
          what do you want to make?
        </h1>
      </div>

      {/* Categories */}
      <div className="mb-auto">
        <CategoryChips onSelect={handleChipSelect} />
      </div>

      {/* Input Area */}
      <div className="mt-8 space-y-4">
        <CreateInput value={prompt} onChange={setPrompt} onSubmit={handleSubmit} />
        <div className="flex flex-col items-center gap-1 text-xs pb-4">
          <span className="text-muted-foreground">Start creating for free</span>
          <a href="#" className="text-primary hover:underline font-medium decoration-primary/50 underline-offset-4">
            Join Replit Core to unlock more usage
          </a>
        </div>
      </div>

      {/* Import from GitHub sheet */}
      <AnimatePresence>
        {showImport && (
          <ImportFromGitHubSheet
            onClose={() => setShowImport(false)}
            onImport={handleStartImport}
          />
        )}
      </AnimatePresence>

      {/* Full-screen importing animation */}
      <AnimatePresence>
        {importingRepo && (
          <ImportingScreen repoUrl={importingRepo} onDone={handleImportDone} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
